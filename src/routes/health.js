const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    service: 'liteparse-api',
  });
});

module.exports = router;
