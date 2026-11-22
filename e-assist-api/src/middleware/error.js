import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { isProd } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const i = err.issues[0];
    const field = i.path.join('.');
    return res.status(400).json({ message: field ? `${field}: ${i.message}` : i.message });
  }
  if (err instanceof MulterError) {
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB).' : err.message });
  }
  if (err.code === 'P2002') return res.status(409).json({ message: 'That record already exists.' }); // Prisma unique violation
  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });

  console.error(err);
  res.status(err.status || 500).json({ message: isProd ? 'Something went wrong on our side. Please try again.' : err.message });
}
