import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { serializeMessage } from '../../utils/serializers.js';

const CHAT_OPEN = ['IN_PROGRESS', 'AWAITING_CONFIRMATION', 'DISPUTED'];
const CHAT_READABLE = [...CHAT_OPEN, 'COMPLETED'];

async function participantTask(userId, taskId) {
  const t = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, title: true, status: true, customerId: true, assistantId: true } });
  if (!t) throw new ApiError(404, 'Task not found.');
  if (t.customerId !== userId && t.assistantId !== userId) throw new ApiError(403, 'You are not part of this task.');
  return t;
}

export async function canAccess(userId, taskId) {
  try {
    const t = await participantTask(userId, taskId);
    return CHAT_READABLE.includes(t.status);
  } catch {
    return false;
  }
}

export async function history(userId, taskId) {
  await participantTask(userId, taskId);
  const rows = await prisma.message.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' }, take: 500 });
  return rows.map(serializeMessage);
}

export async function saveMessage({ taskId, senderId, text }) {
  const t = await participantTask(senderId, taskId);
  if (!CHAT_OPEN.includes(t.status)) throw new ApiError(409, 'Chat is closed for this task.');
  const clean = String(text || '').trim().slice(0, 1000);
  if (!clean) throw new ApiError(400, 'Message is empty.');
  const m = await prisma.message.create({ data: { taskId, senderId, text: clean } });
  return serializeMessage(m);
}
