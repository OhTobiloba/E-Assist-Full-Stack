// Demo data. Run:  npm run db:seed   (safe to run more than once)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const H = 3600e3;

async function upsertUser(phone, name, extra = {}) {
  return prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      phone, name, phoneVerified: true, profileComplete: true, email: `${name.split(' ')[0].toLowerCase()}@example.com`, homeArea: 'Lagos',
      wallet: { create: { balance: extra.balance ?? 0 } }, ...extra.data,
    },
  });
}

async function main() {
  const demo = await upsertUser('+2348030000001', 'Demo User', {
    balance: 42300,
    data: { roles: ['CUSTOMER', 'ASSISTANT'], activeRole: 'CUSTOMER', kycStatus: 'APPROVED' },
  });
  const funmi = await upsertUser('+2348030000002', 'Funmi Adeyemi', { balance: 50000, data: { roles: ['CUSTOMER'], activeRole: 'CUSTOMER' } });
  const chidi = await upsertUser('+2348030000003', 'Chidi Nwosu', { balance: 50000, data: { roles: ['CUSTOMER'], activeRole: 'CUSTOMER' } });
  await upsertUser('+2348030000004', 'Tobi Ogundele', { data: { roles: ['ASSISTANT'], activeRole: 'ASSISTANT', kycStatus: 'APPROVED' } });

  if ((await prisma.task.count({ where: { customerId: { in: [funmi.id, chidi.id] } } })) === 0) {
    const mk = (customerId, title, category, budget, pickup, dropoff, hours, lat, lng) => ({
      customerId, title, category, budget, pickup, dropoff, lat, lng, description: '', deadline: new Date(Date.now() + hours * H),
    });
    await prisma.task.createMany({
      data: [
        mk(funmi.id, 'Pick up signed contract from VI, drop at Ikoyi office', 'Documents', 4500, 'Adeola Odeku St, Victoria Island', '14 Alexander Avenue, Ikoyi', 5, 6.4281, 3.4219),
        mk(chidi.id, 'Buy 20 branded envelopes from Computer Village', 'Corporate', 6000, 'Computer Village, Ikeja', 'Maryland Mall, Maryland', 26, 6.5964, 3.3421),
        mk(funmi.id, 'Grocery run: 6 items from Ikeja City Mall', 'Shopping', 3500, 'Ikeja City Mall', 'Allen Avenue, Ikeja', 8, 6.6141, 3.3566),
      ],
    });
  }

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@eassist.app';
  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, name: 'E Assist Admin', passwordHash: await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'ChangeMe123!', 10) },
  });
  console.log('Seeded. Demo login phone: 0803 000 0001 (use OTP login).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
})
  .finally(() => prisma.$disconnect());
