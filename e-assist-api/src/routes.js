import { Router } from 'express';
import auth from './modules/auth/auth.routes.js';
import users from './modules/users/users.routes.js';
import kyc from './modules/kyc/kyc.routes.js';
import tasks from './modules/tasks/tasks.routes.js';
import notifications from './modules/notifications/notifications.routes.js';
import wallet from './modules/wallet/wallet.routes.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ ok: true, service: 'e-assist-api', time: new Date().toISOString() }));
router.use(auth);
router.use(users);
router.use(kyc);
router.use(tasks);
router.use(notifications);
router.use(wallet);

// PHASE 3: router.use(payments)   (wallet fund / verify / webhook / withdraw)
// PHASE 4: router.use('/admin', admin), ratings, disputes

export default router;
