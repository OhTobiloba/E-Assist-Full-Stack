// Escrow ledger. Only used when ESCROW_ENABLED=true (and a task was created with escrowHeld=true).
// All functions take a Prisma transaction client `tx` so money moves atomically with the task status change.
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

async function credit(tx, userId, amount) {
  return tx.wallet.upsert({ where: { userId }, create: { userId, balance: amount }, update: { balance: { increment: amount } } });
}

// Lock the budget when a task is posted. Fails with 402 if the wallet can't cover it.
export async function hold(tx, { userId, taskId, amount }) {
  const r = await tx.wallet.updateMany({ where: { userId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
  if (r.count === 0) throw new ApiError(402, 'Insufficient wallet balance. Fund your wallet to post this task.');
  await tx.transaction.create({ data: { userId, taskId, type: 'ESCROW_HOLD', amount } });
}

// Pays out the held budget: `assistantGross` to the assistant (minus commission), `refund` back to the customer.
// assistantGross + refund must equal the task budget.
export async function settle(tx, task, { assistantGross = 0, refund = 0, commissionRate = 0, assistantType = 'ESCROW_RELEASE' }) {
  if (assistantGross + refund !== task.budget) throw new Error('Escrow math mismatch');
  if (assistantGross > 0 && task.assistantId) {
    const commission = Math.round(assistantGross * commissionRate);
    const net = assistantGross - commission;
    await credit(tx, task.assistantId, net);
    await tx.transaction.create({ data: { userId: task.assistantId, taskId: task.id, type: assistantType, amount: net, commission } });
  } else if (assistantGross > 0) {
    refund += assistantGross; // no assistant to pay -> back to customer
  }
  if (refund > 0) {
    await credit(tx, task.customerId, refund);
    await tx.transaction.create({ data: { userId: task.customerId, taskId: task.id, type: 'ESCROW_REFUND', amount: refund } });
  }
}

export const feeFor = (budget) => Math.round(budget * env.CANCEL_FEE_RATE);
export const commissionFor = (amount) => Math.round(amount * env.COMMISSION_RATE);
