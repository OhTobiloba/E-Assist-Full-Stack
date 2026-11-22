import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import * as svc from './tasks.service.js';
import * as chat from '../chat/chat.service.js';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['Documents', 'Errand', 'Shopping', 'Corporate'];

const createSchema = z.object({
  title: z.string().trim().min(5, 'Give your task a clear title').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  category: z.enum(CATEGORIES),
  budget: z.coerce.number().int().min(500, 'Minimum budget is ₦500').max(500000, 'Maximum budget is ₦500,000'),
  pickup: z.string().trim().min(3).max(200),
  dropoff: z.string().trim().min(3).max(200),
  deadline: z.string().refine((v) => new Date(v).getTime() > Date.now(), 'Deadline must be in the future'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

const feedSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  minBudget: z.coerce.number().int().min(0).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
  status: z.string().optional(), // accepted for compatibility; the feed is always "open"
});

router.post('/tasks', upload.single('photo'), validate(createSchema),
  asyncHandler(async (req, res) => res.status(201).json(await svc.createTask(req.user, req.body, req.file))));

router.get('/tasks', validate(feedSchema, 'query'), asyncHandler(async (req, res) => res.json(await svc.listFeed(req.user, req.query))));

// declared BEFORE /tasks/:id so "mine" isn't treated as an id
router.get('/tasks/mine', asyncHandler(async (req, res) => {
  const role = req.query.role === 'assistant' ? 'assistant' : 'customer';
  res.json(await svc.listMine(req.user, role));
}));

router.get('/tasks/:id', asyncHandler(async (req, res) => res.json(await svc.getTask(req.params.id))));
router.post('/tasks/:id/accept', asyncHandler(async (req, res) => res.json(await svc.acceptTask(req.user, req.params.id))));
router.post('/tasks/:id/cancel', asyncHandler(async (req, res) => res.json(await svc.cancelTask(req.user, req.params.id))));
router.post('/tasks/:id/complete', upload.single('proof'), asyncHandler(async (req, res) => res.json(await svc.completeTask(req.user, req.params.id, req.file))));
router.post('/tasks/:id/confirm', asyncHandler(async (req, res) => res.json(await svc.confirmTask(req.user, req.params.id))));

router.get('/tasks/:id/messages', asyncHandler(async (req, res) => res.json(await chat.history(req.user.id, req.params.id))));

export default router;
