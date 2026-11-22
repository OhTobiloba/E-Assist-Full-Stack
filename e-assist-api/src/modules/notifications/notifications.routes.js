import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { serializeNotification } from '../../utils/serializers.js';

const router = Router();
router.use(requireAuth);

router.get('/notifications', asyncHandler(async (req, res) => {
  const rows = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(rows.map(serializeNotification));
}));

// NOTE: read-all must be declared before /:id/read
router.patch('/notifications/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
  res.json({ ok: true });
}));

router.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
  res.json({ ok: true });
}));

export default router;
