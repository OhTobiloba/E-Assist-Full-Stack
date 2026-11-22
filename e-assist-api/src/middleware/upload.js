import multer from 'multer';

// Files are kept in memory, then streamed to Cloudinary. 5 MB each, images only.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.mimetype)) {
      const e = new Error('Only image files (JPG, PNG, WEBP) are allowed.');
      e.status = 400;
      return cb(e);
    }
    cb(null, true);
  },
});
