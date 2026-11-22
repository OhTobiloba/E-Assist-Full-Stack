// PHASE 2 ships only the read side so you can see escrow movements.
// PHASE 3 adds: POST /wallet/fund, GET /wallet/verify/:ref, POST /wallet/webhook (Paystack),
// GET /wallet/banks, GET /wallet/resolve-account, POST /wallet/withdraw. See docs/API_CONTRACT_PHASE3_4.md
import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const LABELS = {
  DEPOSIT: ['Wallet funded', 1],
  ESCROW_HOLD: ['Task escrow hold', -1],
  ESCROW_RELEASE: ['Task payment released', 1],
  ESCROW_REFUND: ['Escrow refunded', 1],
  CANCEL_FEE: ['Cancellation compensation', 1],
  WITHDRAWAL: ['Withdrawal', -1],
};

router.get('/wallet', asyncHandler(async (req, res) => {
  const wallet = await prisma.wallet.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id }, update: {} });
  const txns = await prisma.transaction.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50, include: { task: { select: { title: true } } } });
  res.json({
    balance: wallet.balance,
    transactions: txns.map((t) => ({
      id: t.id,
      type: t.type.toLowerCase(),
      title: LABELS[t.type][0],
      subtitle: t.task?.title || '',
      amount: LABELS[t.type][1] * t.amount, // signed: + money in, - money out
      commission: t.commission,
      status: t.status.toLowerCase(),
      createdAt: t.createdAt.getTime(),
    })),
  });
}));

export default router;
