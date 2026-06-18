import fs from 'fs';
import { LiteParse } from '@llamaindex/liteparse';

export async function parseDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });
  }

  const filePath = req.file.path;
  try {
    const format = (req.body.format || 'text').toLowerCase();
    if (!['text', 'json'].includes(format)) {
      return res.status(400).json({ error: 'format must be "text" or "json"' });
    }

    const parser = new LiteParse({
      ocrEnabled: req.body.no_ocr !== 'true',
      ocrLanguage: req.body.ocr_language || 'eng',
      maxPages: req.body.max_pages ? parseInt(req.body.max_pages) : 1000,
      ...(req.body.target_pages && { targetPages: req.body.target_pages }),
      ...(req.body.password && { password: req.body.password }),
    });

    const result = await parser.parse(filePath);
    fs.unlink(filePath, () => {});

    return res.json({
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size_bytes: req.file.size,
        format,
        result: format === 'text' ? result.text : result,
      },
    });
  } catch (err) {
    fs.unlink(filePath, () => {});
    console.error('Parse error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse document' });
  }
}

export async function screenshotDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });
  }

  const filePath = req.file.path;
  try {
    const parser = new LiteParse({
      dpi: req.body.dpi ? parseInt(req.body.dpi) : 150,
      ...(req.body.password && { password: req.body.password }),
      ...(req.body.target_pages && { targetPages: req.body.target_pages }),
    });

    // screenshot() returns a Promise that resolves to an array-like object
    const screenshots = await parser.screenshot(filePath);
    fs.unlink(filePath, () => {});

    const arr = Array.isArray(screenshots) ? screenshots : [screenshots];
    const pages = arr.map((s) => ({
      page: s.pageNum,
      width: s.width,
      height: s.height,
      format: 'png',
      data: Buffer.from(s.imageBuffer).toString('base64'),
    }));

    return res.json({
      data: {
        filename: req.file.originalname,
        page_count: pages.length,
        pages,
      },
    });
  } catch (err) {
    fs.unlink(filePath, () => {});
    console.error('Screenshot error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate screenshots' });
  }
}
