import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { uploadImage } from '../../config/cloudinary.js';
import { ApiError } from '../../utils/ApiError.js';
import { distanceKm } from '../../utils/geo.js';
import { serializeTask, taskInclude } from '../../utils/serializers.js';
import { notify } from '../../services/notify.js';
import * as escrow from '../wallet/escrow.service.js';

const naira = (n) => `₦${n.toLocaleString('en-NG')}`;

async function getOrThrow(id) {
  const t = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!t) throw new ApiError(404, 'Task not found.');
  return t;
}

// ---- create ----
export async function createTask(user, input, photoFile) {
  if (!user.roles.includes('CUSTOMER')) throw new ApiError(403, 'Enable the customer role to post tasks.');
  let photoUrl = null;
  if (photoFile) photoUrl = (await uploadImage(photoFile.buffer, { folder: 'e-assist/tasks' })).secure_url;

  const task = await prisma.$transaction(async (tx) => {
    const t = await tx.task.create({
      data: { ...input, deadline: new Date(input.deadline), photoUrl, customerId: user.id, escrowHeld: env.ESCROW_ENABLED },
    });
    if (env.ESCROW_ENABLED) await escrow.hold(tx, { userId: user.id, taskId: t.id, amount: t.budget });
    return t;
  });
  await notify(user.id, { title: 'Task posted', body: `"${task.title}" is now visible to assistants nearby.`, taskId: task.id });
  return serializeTask(await getOrThrow(task.id));
}

// ---- feed (assistants) ----
export async function listFeed(user, q) {
  const where = {
    status: 'OPEN',
    customerId: { not: user.id },
    customer: { status: 'ACTIVE' },
    deadline: { gt: new Date() },
    ...(q.category ? { category: q.category } : {}),
    ...(q.minBudget ? { budget: { gte: q.minBudget } } : {}),
  };
  const rows = await prisma.task.findMany({ where, include: taskInclude, orderBy: { createdAt: 'desc' }, take: 200 });
  const hasPos = q.lat != null && q.lng != null;
  let out = rows.map((t) => ({ t, d: hasPos && t.lat != null ? distanceKm(q.lat, q.lng, t.lat, t.lng) : null }));
  if (hasPos && q.radiusKm) out = out.filter((x) => x.d == null || x.d <= q.radiusKm);
  if (hasPos) out.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
  return out.map((x) => serializeTask(x.t, x.d));
}

// ---- mine ----
export async function listMine(user, role) {
  const where = role === 'assistant' ? { assistantId: user.id } : { customerId: user.id };
  const rows = await prisma.task.findMany({ where, include: taskInclude, orderBy: { createdAt: 'desc' }, take: 200 });
  return rows.map((t) => serializeTask(t));
}

export async function getTask(id) {
  return serializeTask(await getOrThrow(id));
}

// ---- accept (atomic: only one assistant can win) ----
export async function acceptTask(user, id) {
  if (!user.roles.includes('ASSISTANT')) throw new ApiError(403, 'Enable the assistant role to accept tasks.');
  if (user.kycStatus !== 'APPROVED') throw new ApiError(403, 'Verify your identity before accepting tasks.');
  const r = await prisma.task.updateMany({
    where: { id, status: 'OPEN', customerId: { not: user.id } },
    data: { status: 'IN_PROGRESS', assistantId: user.id, acceptedAt: new Date() },
  });
  if (r.count === 0) {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) throw new ApiError(404, 'Task not found.');
    if (t.customerId === user.id) throw new ApiError(403, 'You cannot accept your own task.');
    throw new ApiError(409, 'This task was already taken.');
  }
  const t = await getOrThrow(id);
  await notify(t.customerId, { title: 'Task accepted', body: `${user.name} accepted "${t.title}".`, taskId: id, sms: true });
  await notify(user.id, { title: 'You accepted a task', body: `Chat with ${t.customer.name} to get started.`, taskId: id });
  return serializeTask(t);
}

// ---- cancel ----
// Customer + OPEN          -> free, full refund
// Customer + IN_PROGRESS   -> cancel fee (CANCEL_FEE_RATE) goes to the assistant, rest refunded
// Assistant + IN_PROGRESS  -> free; task re-opens for other assistants
export async function cancelTask(user, id) {
  const t = await getOrThrow(id);
  const isCustomer = t.customerId === user.id;
  const isAssistant = t.assistantId === user.id;
  if (!isCustomer && !isAssistant) throw new ApiError(403, 'You are not part of this task.');
  if (t.status === 'AWAITING_CONFIRMATION') throw new ApiError(409, 'Once delivered, you can confirm or raise a dispute instead of cancelling.');
  if (!['OPEN', 'IN_PROGRESS'].includes(t.status)) throw new ApiError(409, 'This task can no longer be cancelled.');

  if (isAssistant) {
    await prisma.$transaction([
      prisma.task.update({ where: { id }, data: { status: 'OPEN', assistantId: null, acceptedAt: null } }),
      prisma.user.update({ where: { id: user.id }, data: { cancellations: { increment: 1 } } }),
    ]);
    await notify(t.customerId, { title: 'Assistant cancelled', body: `${user.name} can't complete "${t.title}". It's open to other assistants again.`, taskId: id, sms: true });
    return serializeTask(await getOrThrow(id));
  }

  // customer cancels
  const fee = t.status === 'IN_PROGRESS' ? escrow.feeFor(t.budget) : 0;
  await prisma.$transaction(async (tx) => {
    const r = await tx.task.updateMany({ where: { id, status: t.status }, data: { status: 'CANCELLED' } });
    if (r.count === 0) throw new ApiError(409, 'The task changed. Refresh and try again.');
    if (t.escrowHeld) {
      await escrow.settle(tx, t, { assistantGross: fee, refund: t.budget - fee, assistantType: 'CANCEL_FEE' });
    }
  });
  if (t.assistantId) await notify(t.assistantId, { title: 'Task cancelled', body: `"${t.title}" was cancelled by the customer.${fee && t.escrowHeld ? ` You received ${naira(fee)} as compensation.` : ''}`, taskId: id, sms: true });
  await notify(user.id, { title: 'Task cancelled', body: `You cancelled "${t.title}".${t.escrowHeld ? ' Your refund is in your wallet.' : ''}`, taskId: id });
  return serializeTask(await getOrThrow(id));
}

// ---- complete (assistant) ----
export async function completeTask(user, id, proofFile) {
  let proofUrl = null;
  if (proofFile) proofUrl = (await uploadImage(proofFile.buffer, { folder: 'e-assist/proofs' })).secure_url;
  const r = await prisma.task.updateMany({
    where: { id, status: 'IN_PROGRESS', assistantId: user.id },
    data: { status: 'AWAITING_CONFIRMATION', proofUrl, completedAt: new Date(), autoReleaseAt: new Date(Date.now() + env.AUTO_RELEASE_HOURS * 3600e3) },
  });
  if (r.count === 0) throw new ApiError(409, 'This task is not in progress, or it is not assigned to you.');
  const t = await getOrThrow(id);
  await notify(t.customerId, { title: 'Task marked complete', body: `${user.name} finished "${t.title}". Please review and confirm within ${env.AUTO_RELEASE_HOURS} hours.`, taskId: id, sms: true });
  return serializeTask(t);
}

// ---- confirm (customer, or the auto-release job) ----
export async function confirmTask(user, id, { auto = false } = {}) {
  const before = await getOrThrow(id);
  if (!auto && before.customerId !== user.id) throw new ApiError(403, 'Only the customer can confirm.');
  await prisma.$transaction(async (tx) => {
    const r = await tx.task.updateMany({ where: { id, status: 'AWAITING_CONFIRMATION' }, data: { status: 'COMPLETED', autoReleaseAt: null } });
    if (r.count === 0) throw new ApiError(409, 'Nothing to confirm on this task right now.');
    if (before.escrowHeld) await escrow.settle(tx, before, { assistantGross: before.budget, commissionRate: env.COMMISSION_RATE });
  });
  const t = await getOrThrow(id);
  const payout = t.escrowHeld ? ` ${naira(t.budget - escrow.commissionFor(t.budget))} was added to your wallet.` : '';
  if (t.assistantId) await notify(t.assistantId, { title: 'Task confirmed', body: `"${t.title}" was ${auto ? 'auto-confirmed' : 'confirmed'}.${payout}`, taskId: id, sms: true });
  await notify(t.customerId, { title: 'Task completed', body: `"${t.title}" is complete.`, taskId: id });
  return serializeTask(t);
}

// Called by the background job
export async function autoReleaseDue() {
  const due = await prisma.task.findMany({ where: { status: 'AWAITING_CONFIRMATION', autoReleaseAt: { lte: new Date() } }, select: { id: true } });
  for (const { id } of due) await confirmTask(null, id, { auto: true }).catch((e) => console.error('auto-release failed', id, e.message));
  return due.length;
}
