import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  getUserFiles,
  attachFile,
  getItemFiles,
  deleteFile
} from '../controllers/fileAttachment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { fileUploadLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// All file routes require authentication
router.use(authenticateToken);

// Multer configuration for file uploads (memory storage - safe)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// File upload endpoint (safe - creates new records only)
router.post('/upload', fileUploadLimiter, upload.single('file'), uploadFile);

// Get user's files (safe - read-only)
router.get('/my-files', getUserFiles);

// Attach file to existing item (safe - adds reference only)
router.post('/attach', attachFile);

// Get files attached to specific item (safe - read-only)
router.get('/item/:attachedTo/:attachedToId', getItemFiles);

// Soft delete file (safe - doesn't remove data)
router.delete('/:fileId', deleteFile);

export default router;
