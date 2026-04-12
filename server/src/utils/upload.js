// ─────────────────────────────────────────────────────────
// Multer Upload Configuration – file upload middleware
// ─────────────────────────────────────────────────────────

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// Ensure upload directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Create a multer upload instance for a given sub-folder.
 * @param {string} folder - Sub-folder inside uploads/ (e.g. 'notices', 'notes')
 * @param {number} maxSizeMB - Max file size in MB (default 10)
 */
export function createUploader(folder, maxSizeMB = 10) {
  const dest = path.join(UPLOADS_ROOT, folder);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // Allow common file types
      const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|zip/;
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      const mime = file.mimetype;

      if (allowed.test(ext) || mime.startsWith('image/') || mime === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error(`File type .${ext} is not supported`), false);
      }
    }
  });
}

// Pre-built uploaders for each module
export const noticeUploader = createUploader('notices', 10);
export const noteUploader = createUploader('notes', 15);
