// ─────────────────────────────────────────────────────────
// Cloudinary Upload Configuration – replaces local multer
// ─────────────────────────────────────────────────────────

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ── Configure Cloudinary ────────────────────────────────
cloudinary.config({
  cloud_name: 'dft7k0axp',
  api_key: '354574311983594',
  api_secret: '4pVGX9MpY4rmLWkZtOp7a7jVirk',
});

export { cloudinary };

/**
 * Create a multer upload instance that streams to Cloudinary.
 * @param {string} folder - Sub-folder in Cloudinary (e.g. 'smart-campus/notices')
 * @param {number} maxSizeMB - Max file size in MB (default 10)
 */
export function createUploader(folder, maxSizeMB = 10) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isPdf = file.mimetype === 'application/pdf';
      return {
        folder: `smart-campus/${folder}`,
        resource_type: isPdf ? 'raw' : 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'zip'],
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      };
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

// Pre-built uploaders for each module
export const noticeUploader = createUploader('notices', 10);
export const noteUploader = createUploader('notes', 15);
export const assignmentUploader = createUploader('assignments', 20);
export const avatarUploader = createUploader('avatars', 5);
