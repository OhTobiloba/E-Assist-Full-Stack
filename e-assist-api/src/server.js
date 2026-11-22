import http from 'node:http';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { app } from './app.js';
import { initSockets } from './sockets/index.js';
import { startJobs } from './jobs/autoRelease.js';

const server = http.createServer(app);
initSockets(server);

async function start() {
  await prisma.$connect().catch((e) => {
    console.error('\n❌ Cannot connect to the database. Check DATABASE_URL and that migrations ran (npm run db:migrate).\n', e.message);
    process.exit(1);
  });
  server.listen(env.PORT, () => {
    console.log(`\n✅ E·Assist API running on http://localhost:${env.PORT}  (${env.NODE_ENV})`);
    console.log(`   SMS: ${env.SMS_PROVIDER} · Escrow: ${env.ESCROW_ENABLED ? 'ON' : 'off'} · OTP dev echo: ${env.OTP_DEV_ECHO ? 'ON' : 'off'}\n`);
  });

//   setTimeout(async () => {
//   console.log('Running delayed database test...');

//   try {
//     console.log('Task count:', await prisma.task.count());
//   } catch (error) {
//     console.error('Delayed database test failed:', error);
//   }
// }, 20_000);

  startJobs();
}
start();

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
