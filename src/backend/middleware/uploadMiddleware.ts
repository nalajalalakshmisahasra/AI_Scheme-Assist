/**
 * Document Upload Middleware (Multer Memory Storage)
 */

import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_FILE_SIZE } from '../utils/validators.ts';

const storage = multer.memoryStorage();

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE, // 10MB
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, JPG, PNG, WEBP.`));
    }
  }
});
