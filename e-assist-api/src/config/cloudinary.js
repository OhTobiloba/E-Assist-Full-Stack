import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryEnabled, env } from './env.js';

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('⚠️  Cloudinary not configured: uploads are accepted but NOT stored (dev only).');
}

// Uploads an in-memory file buffer. `private: true` => only reachable with a signed URL (used for KYC documents).
export function uploadImage(buffer, { folder, private: isPrivate = false }) {
  if (!cloudinaryEnabled) return Promise.resolve({ secure_url: null, public_id: null });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', type: isPrivate ? 'authenticated' : 'upload' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Signed, expiring link for a private image (for the admin KYC review screen, Phase 4)
export function signedUrl(publicId, seconds = 600) {
  if (!cloudinaryEnabled || !publicId) return null;
  return cloudinary.url(publicId, { type: 'authenticated', sign_url: true, secure: true, expires_at: Math.floor(Date.now() / 1000) + seconds });
}
