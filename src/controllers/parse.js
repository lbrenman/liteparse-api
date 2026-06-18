const fs = require('fs');
const path = require('path');

// Lazily load liteparse so startup doesn't fail if not yet installed
let liteparse;
function getLiteparse() {
  if (!liteparse) {
    liteparse = require('@llamaindex/liteparse');
  }
  return liteparse;
}

/**
 * POST /parse
 *
 * Multipart form fields:
 *   file        (required) — document file (PDF, DOCX, PPTX, XLSX, images)
 *   format      (optional) — "text" | "json"  (default: "text")
 *   no_ocr      (optional) — "true" to disable OCR
 *   ocr_language (optional) — Tesseract language code, e.g. "eng" (default: "eng")
 *   max_pages   (optional) — integer max pages to parse (default: 1000)
 *   target_pages (optional) — page range string e.g. "1-5,10" (default: all)
 *   password    (optional) — password for encrypted PDFs
 */
exports.parseDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });
  }

  const filePath = req.file.path;

  try {
    const { parsePdf } = getLiteparse();

    const format = (req.body.format || 'text').toLowerCase();
    if (!['text', 'json'].includes(format)) {
      return res.status(400).json({ error: 'format must be "text" or "json"' });
    }

    const options = {
      format,
      ocr: req.body.no_ocr !== 'true',
      ocrLanguage: req.body.ocr_language || 'eng',
      maxPages: req.body.max_pages ? parseInt(req.body.max_pages) : 1000,
    };

    if (req.body.target_pages) {
      options.targetPages = req.body.target_pages;
    }
    if (req.body.password) {
      options.password = req.body.password;
    }

    const result = await parsePdf(filePath, options);

    return res.json({
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size_bytes: req.file.size,
        format,
        result,
      },
    });
  } catch (err) {
    console.error('Parse error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse document' });
  } finally {
    // Always clean up the temp file
    fs.unlink(filePath, () => {});
  }
};

/**
 * POST /parse/screenshot
 *
 * Multipart form fields:
 *   file         (required) — PDF file
 *   target_pages (optional) — page range string e.g. "1,3,5" or "1-5" (default: all)
 *   dpi          (optional) — rendering DPI (default: 150)
 *   password     (optional) — password for encrypted PDFs
 *
 * Returns an array of base64-encoded PNG images, one per page.
 */
exports.screenshotDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });
  }

  const filePath = req.file.path;

  try {
    const { screenshotPdf } = getLiteparse();

    const options = {
      dpi: req.body.dpi ? parseInt(req.body.dpi) : 150,
    };

    if (req.body.target_pages) {
      options.targetPages = req.body.target_pages;
    }
    if (req.body.password) {
      options.password = req.body.password;
    }

    const screenshots = await screenshotPdf(filePath, options);

    // screenshots is an array of Buffer objects (PNG images)
    const pages = screenshots.map((buf, i) => ({
      page: i + 1,
      format: 'png',
      data: Buffer.isBuffer(buf) ? buf.toString('base64') : buf,
    }));

    return res.json({
      data: {
        filename: req.file.originalname,
        page_count: pages.length,
        pages,
      },
    });
  } catch (err) {
    console.error('Screenshot error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate screenshots' });
  } finally {
    fs.unlink(filePath, () => {});
  }
};
