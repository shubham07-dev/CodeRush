// ─────────────────────────────────────────────────────────
// Upload Configuration – Cloudinary when available, local fallback otherwise
// ─────────────────────────────────────────────────────────

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';

let cloudinary = null;
let CloudinaryStorage = null;
let useCloudinary = false;

// Only configure Cloudinary if all 3 credentials are provided
if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  try {
    const cloudinaryModule = await import('cloudinary');
    const storageModule = await import('multer-storage-cloudinary');

    cloudinary = cloudinaryModule.v2;
    CloudinaryStorage = storageModule.CloudinaryStorage;

    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
    });

    useCloudinary = true;
    console.log('☁️  Cloudinary configured successfully.');
  } catch (err) {
    console.warn('⚠️  Cloudinary packages not available, falling back to local uploads.');
  }
} else {
  console.warn('⚠️  Cloudinary credentials not found in .env. Using local file uploads.');
}

export { cloudinary };

/**
 * Create a multer upload instance.
 * Uses Cloudinary if configured, otherwise stores files locally in /uploads.
 * @param {string} folder - Sub-folder name (e.g. 'assignments')
 * @param {number} maxSizeMB - Max file size in MB (default 10)
 */
export function createUploader(folder, maxSizeMB = 10) {
  let storage;

  if (useCloudinary && cloudinary && CloudinaryStorage) {
    storage = new CloudinaryStorage({
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
  } else {
    // Local fallback – save to ./uploads/<folder>/
    const uploadDir = path.resolve(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
    });
  }

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
