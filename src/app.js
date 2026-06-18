const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const healthRouter = require('./routes/health');
const apiDocsRouter = require('./routes/apidocs');
const parseRouter = require('./routes/parse');
const authMiddleware = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Unauthenticated routes
app.use('/health', healthRouter);
app.use('/api-docs', apiDocsRouter);

// Authenticated routes
app.use('/parse', authMiddleware, parseRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
