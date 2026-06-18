import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { parseDocument, screenshotDocument } from '../controllers/parse.js';

const router = Router();

const storage = multer.diskStorage({
  destination: '/tmp/liteparse-uploads/',
  filename: (req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

router.post('/', upload.single('file'), parseDocument);
router.post('/screenshot', upload.single('file'), screenshotDocument);

export default router;
