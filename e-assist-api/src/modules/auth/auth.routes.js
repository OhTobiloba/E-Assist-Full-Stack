import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import * as svc from './auth.service.js';

const router = Router();
const phone = z.string().min(10).max(20);

router.post('/signup', authLimiter, validate(z.object({ phone, name: z.string().trim().min(2).max(80) })),
  asyncHandler(async (req, res) => res.status(201).json(await svc.signup(req.body))));

router.post('/otp/send', authLimiter, validate(z.object({ phone })),
  asyncHandler(async (req, res) => res.json(await svc.requestOtp(req.body))));

router.post('/otp/verify', authLimiter, validate(z.object({ phone, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') })),
  asyncHandler(async (req, res) => res.json(await svc.confirmOtp(req.body))));

router.post('/login', authLimiter, validate(z.object({ phone, password: z.string().min(1) })),
  asyncHandler(async (req, res) => res.json(await svc.loginWithPassword(req.body))));

router.post('/auth/refresh', validate(z.object({ refreshToken: z.string().min(10) })),
  asyncHandler(async (req, res) => res.json(await svc.refresh(req.body))));

router.post('/auth/logout', validate(z.object({ refreshToken: z.string().optional() })),
  asyncHandler(async (req, res) => res.json(await svc.logout(req.body))));

router.get('/me', requireAuth, (req, res) => res.json(svc.me(req.user)));

export default router;
