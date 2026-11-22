import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  OTP_PEPPER: z.string().min(16, 'OTP_PEPPER must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().default('1h'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(30),
  CLIENT_ORIGINS: z.string().default('http://localhost:3000'),

  SMS_PROVIDER: z.enum(['console', 'termii']).default('console'),
  OTP_DEV_ECHO: bool,
  SMS_NOTIFICATIONS: bool,
  TERMII_API_KEY: z.string().optional().default(''),
  TERMII_SENDER_ID: z.string().optional().default(''),
  TERMII_BASE_URL: z.string().default('https://api.ng.termii.com'),
  TERMII_CHANNEL: z.string().default('generic'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  KYC_AUTO_APPROVE_SECONDS: z.coerce.number().default(0),

  ESCROW_ENABLED: bool,
  COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.15),
  CANCEL_FEE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  AUTO_RELEASE_HOURS: z.coerce.number().default(48),

  PAYSTACK_SECRET_KEY: z.string().optional().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  for (const i of parsed.error.issues) console.error(`  • ${i.path.join('.')}: ${i.message}`);
  console.error('\nCopy .env.example to .env and fill in the missing values.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const clientOrigins = env.CLIENT_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
export const cloudinaryEnabled = !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

// Fail fast on unsafe / incomplete production settings
const problems = [];
if (env.SMS_PROVIDER === 'termii' && !(env.TERMII_API_KEY && env.TERMII_SENDER_ID)) problems.push('SMS_PROVIDER=termii needs TERMII_API_KEY and TERMII_SENDER_ID');
if (isProd && env.OTP_DEV_ECHO) problems.push('OTP_DEV_ECHO must be false in production');
if (isProd && env.SMS_PROVIDER === 'console') problems.push('SMS_PROVIDER=console cannot be used in production (OTPs would never reach users)');
if (isProd && !cloudinaryEnabled) problems.push('Cloudinary credentials are required in production');
if (problems.length) {
  console.error('\n❌ Configuration problems:\n' + problems.map((p) => `  • ${p}`).join('\n') + '\n');
  process.exit(1);
}
