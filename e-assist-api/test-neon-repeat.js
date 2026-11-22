import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.ts';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

for (let i = 1; i <= 15; i++) {
  try {
    const count = await prisma.task.count();
    console.log(`Test ${i}: SUCCESS — ${count} tasks`);
  } catch (error) {
    console.log(`Test ${i}: FAILED —`, error.code, error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 5000));
}

await prisma.$disconnect();
