import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the Bearer access token and loads the user onto req.user
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError(401, 'Account not found. Please log in again.');
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'This account is suspended. Contact E Assist support.');
  req.user = user;
  next();
});

export const requireRole = (role) => (req, _res, next) =>
  req.user.roles.includes(role) ? next() : next(new ApiError(403, `This action needs the ${role.toLowerCase()} role on your account.`));
