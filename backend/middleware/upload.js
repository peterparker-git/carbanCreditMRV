import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/uploads directory exists
export const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Storage configuration with safe unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  }
});

// File filter validating type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.originalname}. Only JPEG, PNG, and WebP images are allowed.`));
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5 // Maximum 5 images
  }
});

// Helper to cleanup uploaded files if a subsequent validation or database operation fails
export function cleanupFiles(files) {
  if (!files || !Array.isArray(files)) return;
  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Failed to cleanup file ${file.path}:`, err);
      }
    }
  }
}
