// Dev helper (until the admin panel API exists in Phase 4).
//   npm run cli -- kyc-list
//   npm run cli -- kyc-approve +2348030000005
//   npm run cli -- kyc-reject  +2348030000005 "ID photo is blurry"
//   npm run cli -- wallet-credit +2348030000005 50000     (dev only: fake funding until Paystack is wired in Phase 3)
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { normalizePhone } from '../src/utils/phone.js';
import { decideKyc } from '../src/modules/kyc/kyc.service.js';

const prisma = new PrismaClient();
const [cmd, phoneArg, extra] = process.argv.slice(2);

async function userByPhone() {
  const phone = normalizePhone(phoneArg);
  const user = phone && (await prisma.user.findUnique({ where: { phone } }));
  if (!user) throw new Error(`No user for phone "${phoneArg}"`);
  return user;
}

try {
  if (cmd === 'kyc-list') {
    const rows = await prisma.kycSubmission.findMany({ where: { status: 'PENDING' }, include: { user: true }, orderBy: { createdAt: 'asc' } });
    console.table(rows.map((r) => ({ submission: r.id, name: r.user.name, phone: r.user.phone, submitted: r.createdAt.toISOString() })));
  } else if (cmd === 'kyc-approve' || cmd === 'kyc-reject') {
    const user = await userByPhone();
    const sub = await prisma.kycSubmission.findFirst({ where: { userId: user.id, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
    if (!sub) throw new Error('No pending KYC submission for that user');
    await decideKyc(sub.id, cmd === 'kyc-approve' ? 'APPROVED' : 'REJECTED', extra || null);
    console.log(`${user.name}: ${cmd === 'kyc-approve' ? 'approved' : 'rejected'}`);
  } else if (cmd === 'wallet-credit') {
    const user = await userByPhone();
    const amount = Number(extra);
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Amount must be a positive whole number');
    await prisma.$transaction([
      prisma.wallet.upsert({ where: { userId: user.id }, create: { userId: user.id, balance: amount }, update: { balance: { increment: amount } } }),
      prisma.transaction.create({ data: { userId: user.id, type: 'DEPOSIT', amount, meta: { source: 'dev-cli' } } }),
    ]);
    console.log(`Credited ₦${amount.toLocaleString()} to ${user.name}`);
  } else {
    console.log('Commands: kyc-list | kyc-approve <phone> | kyc-reject <phone> [note] | wallet-credit <phone> <amount>');
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
