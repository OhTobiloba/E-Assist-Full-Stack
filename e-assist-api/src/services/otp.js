import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSms } from './sms.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const hash = (phone, code) => crypto.createHash('sha256').update(`${phone}:${code}:${env.OTP_PEPPER}`).digest('hex');

// Generates, stores (hashed) and texts a 6-digit code.
// Returns { devOtp } ONLY when OTP_DEV_ECHO=true and not in production.
export async function sendOtp(phone) {
  const last = await prisma.otp.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000);
    throw new ApiError(429, `Please wait ${wait}s before requesting another code.`);
  }
  const code = String(crypto.randomInt(100000, 1000000));
  await prisma.otp.deleteMany({ where: { phone, consumedAt: null } }); // only the newest code is valid
  await prisma.otp.create({ data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });

  await sendSms(phone, `Your E-Assist verification code is ${code}. It expires in 5 minutes. Do not share it with anyone.`);
  return env.OTP_DEV_ECHO && !isProd ? { devOtp: code } : {};
}

// Throws unless the code is correct, unexpired and unused.
export async function verifyOtp(phone, code) {
  const otp = await prisma.otp.findFirst({ where: { phone, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!otp || otp.expiresAt < new Date()) throw new ApiError(400, 'This code has expired. Request a new one.');
  if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(429, 'Too many wrong attempts. Request a new code.');

  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(hash(phone, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, 'Incorrect code. Check the SMS and try again.');
  }
  await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
}
