import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizePhone } from '../../utils/phone.js';
import { serializeUser } from '../../utils/serializers.js';
import { sendOtp, verifyOtp } from '../../services/otp.js';
import { issueTokens, revokeRefreshToken, rotateRefreshToken } from '../../services/tokens.js';

const phoneOrThrow = (p) => {
  const n = normalizePhone(p);
  if (!n) throw new ApiError(400, 'Enter a valid Nigerian phone number.');
  return n;
};

export async function signup({ phone, name }) {
  const p = phoneOrThrow(phone);
  const existing = await prisma.user.findUnique({ where: { phone: p } });
  if (existing?.phoneVerified) throw new ApiError(409, 'This number is already registered. Please log in instead.');
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { name } }); // unfinished signup: let them retry
  } else {
    await prisma.user.create({ data: { phone: p, name, wallet: { create: {} } } });
  }
  return { ok: true };
}

export async function requestOtp({ phone }) {
  const p = phoneOrThrow(phone);
  const user = await prisma.user.findUnique({ where: { phone: p } });
  if (!user) throw new ApiError(404, 'No account found for this number. Create one first.');
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'This account is suspended. Contact E Assist support.');
  return { ok: true, ...(await sendOtp(p)) };
}

export async function confirmOtp({ phone, code }) {
  const p = phoneOrThrow(phone);
  const user = await prisma.user.findUnique({ where: { phone: p } });
  if (!user) throw new ApiError(404, 'Account not found.');
  await verifyOtp(p, code);
  const updated = user.phoneVerified ? user : await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
  return { ...(await issueTokens(user.id)), user: serializeUser(updated) };
}

export async function loginWithPassword({ phone, password }) {
  const p = phoneOrThrow(phone);
  const user = await prisma.user.findUnique({ where: { phone: p } });
  // Same message for "no such user" and "wrong password" so numbers can't be probed
  const bad = new ApiError(401, 'Incorrect phone number or password.');
  if (!user || !user.phoneVerified) throw bad;
  if (!user.passwordHash) throw new ApiError(400, "You haven't set a password yet. Log in with an OTP instead.");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw bad;
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'This account is suspended. Contact E Assist support.');
  return { ...(await issueTokens(user.id)), user: serializeUser(user) };
}

export const refresh = ({ refreshToken }) => rotateRefreshToken(refreshToken);
export const logout = ({ refreshToken }) => revokeRefreshToken(refreshToken).then(() => ({ ok: true }));
export const me = (user) => serializeUser(user);
