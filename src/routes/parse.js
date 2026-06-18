cat > src/controllers/parse.js << 'EOF'
const fs = require('fs');
const { LiteParse } = require('@llamaindex/liteparse');

exports.parseDocument = async (req, res) => {
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
    console.error('Parse error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse document' });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

exports.screenshotDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });
  }

  const filePath = req.file.path;

  try {
    const parser = new LiteParse({
      dpi: req.body.dpi ? parseInt(req.body.dpi) : 150,
      ...(req.body.target_pages && { targetPages: req.body.target_pages }),
      ...(req.body.password && { password: req.body.password }),
    });

    const screenshots = parser.screenshot(filePath);

    const pages = screenshots.map((s) => ({
      page: s.pageNum,
      width: s.width,
      height: s.height,
      format: 'png',
      data: s.imageBuffer.toString('base64'),
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
EOF