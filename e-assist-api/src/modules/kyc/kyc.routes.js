import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import * as svc from './kyc.service.js';

const router = Router();
router.use(requireAuth);

router.post('/kyc/upload', upload.fields([{ name: 'idDoc', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]),
  asyncHandler(async (req, res) => res.status(201).json(await svc.submitKyc(req.user, req.files))));
router.get('/kyc/status', asyncHandler(async (req, res) => res.json(await svc.kycStatus(req.user))));

export default router;
