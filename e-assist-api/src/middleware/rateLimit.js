import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };

export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 600, message: { message: 'Too many requests. Please slow down.' } });

// Stricter on endpoints that send SMS or guess credentials
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many attempts. Try again in a few minutes.' } });
