import { env, isProd } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { uploadImage } from '../../config/cloudinary.js';
import { ApiError } from '../../utils/ApiError.js';
import { notify } from '../../services/notify.js';

export async function submitKyc(user, files) {
  if (!user.roles.includes('ASSISTANT')) throw new ApiError(403, 'Identity verification is for assistants.');
  if (user.kycStatus === 'APPROVED') throw new ApiError(409, 'You are already verified.');
  if (user.kycStatus === 'PENDING') throw new ApiError(409, 'Your documents are already under review.');
  const idDoc = files?.idDoc?.[0];
  const selfie = files?.selfie?.[0];
  if (!idDoc || !selfie) throw new ApiError(400, 'Please upload both your ID and a selfie.');

  // KYC images are uploaded as PRIVATE (signed URLs only)
  const [a, b] = await Promise.all([
    uploadImage(idDoc.buffer, { folder: 'e-assist/kyc', private: true }),
    uploadImage(selfie.buffer, { folder: 'e-assist/kyc', private: true }),
  ]);
  const sub = await prisma.kycSubmission.create({
    data: { userId: user.id, idDocPublicId: a.public_id, selfiePublicId: b.public_id },
  });
  await prisma.user.update({ where: { id: user.id }, data: { kycStatus: 'PENDING' } });

  // DEV HELPER: auto-approve so you can test the full flow without an admin panel
  if (!isProd && env.KYC_AUTO_APPROVE_SECONDS > 0) {
    setTimeout(() => decideKyc(sub.id, 'APPROVED').catch(console.error), env.KYC_AUTO_APPROVE_SECONDS * 1000);
  }
  return { status: 'pending' };
}

export async function kycStatus(user) {
  const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { kycStatus: true } });
  return { status: fresh.kycStatus.toLowerCase() };
}

// Used by the dev auto-approve, the CLI, and the admin endpoints (Phase 4)
export async function decideKyc(submissionId, decision, note = null, adminId = null) {
  const sub = await prisma.kycSubmission.findUnique({ where: { id: submissionId } });
  if (!sub || sub.status !== 'PENDING') return null;
  await prisma.$transaction([
    prisma.kycSubmission.update({ where: { id: sub.id }, data: { status: decision, reviewNote: note, reviewedByAdmin: adminId, reviewedAt: new Date() } }),
    prisma.user.update({ where: { id: sub.userId }, data: { kycStatus: decision } }),
  ]);
  await notify(sub.userId, {
    title: decision === 'APPROVED' ? 'Identity verified' : 'Verification rejected',
    body: decision === 'APPROVED' ? 'You can now accept tasks.' : note || 'Please upload clearer photos and try again.',
    sms: true,
  });
  return decision;
}
