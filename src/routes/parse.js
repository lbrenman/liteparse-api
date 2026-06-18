const express = require('express');
const multer = require('multer');
const path = require('path');
const parseController = require('../controllers/parse');

const router = express.Router();

// Store uploads in /tmp with original extension preserved
const storage = multer.diskStorage({
  destination: '/tmp/liteparse-uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
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
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /parse
 * Parse a document file. Returns extracted text or structured JSON.
 */
router.post('/', upload.single('file'), parseController.parseDocument);

/**
 * POST /parse/screenshot
 * Generate page screenshots from a PDF.
 */
router.post('/screenshot', upload.single('file'), parseController.screenshotDocument);

module.exports = router;
