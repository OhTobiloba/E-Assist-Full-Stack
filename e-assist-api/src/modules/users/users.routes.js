import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import * as svc from './users.service.js';

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email('Enter a valid email').optional(),
  homeArea: z.string().trim().min(2).max(120).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72).optional(),
});

// multipart/form-data (photo optional)
router.patch('/profile', upload.single('photo'), validate(profileSchema),
  asyncHandler(async (req, res) => res.json(await svc.updateProfile(req.user, req.body, req.file))));

const roleSchema = z.object({
  roles: z.array(z.enum(['customer', 'assistant'])).min(1).optional(),
  activeRole: z.enum(['customer', 'assistant']).optional(),
}).refine((v) => v.roles || v.activeRole, 'Provide roles or activeRole');

router.patch('/profile/role', validate(roleSchema),
  asyncHandler(async (req, res) => res.json(await svc.updateRole(req.user, req.body))));

export default router;
