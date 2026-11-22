import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { clientOrigins, isProd } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/error.js';
import routes from './routes.js';

export const app = express();

app.set('trust proxy', 1); // behind Render/Railway proxy: correct client IPs for rate limiting
app.use(helmet());
app.use(cors({ origin: clientOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' })); // PHASE 3: Paystack webhook needs the raw body, mount it before this line
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use('/api', apiLimiter, routes);
app.get('/', (_req, res) => res.json({ service: 'E·Assist API', docs: '/api/health' }));
app.use(notFound);
app.use(errorHandler);
