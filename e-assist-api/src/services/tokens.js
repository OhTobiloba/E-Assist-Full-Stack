import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export const signAccessToken = (userId) => jwt.sign({ sub: userId, typ: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });

// Creates an access token + a random refresh token (only its hash is stored)
export async function issueTokens(userId) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  await prisma.refreshToken.create({
    data: { userId, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 864e5) },
  });
  return { token: signAccessToken(userId), refreshToken };
}

// Rotation: the old refresh token is revoked, a new pair is issued
export async function rotateRefreshToken(refreshToken) {
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken || '') } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) throw new ApiError(401, 'Your session has expired. Please log in again.');
  await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
  return issueTokens(row.userId);
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({ where: { tokenHash: sha256(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}
