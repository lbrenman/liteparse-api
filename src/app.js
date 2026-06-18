import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import healthRouter from './routes/health.js';
import apiDocsRouter from './routes/apidocs.js';
import parseRouter from './routes/parse.js';
import authMiddleware from './middleware/auth.js';

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

app.use('/health', healthRouter);
app.use('/api-docs', apiDocsRouter);
app.use('/parse', authMiddleware, parseRouter);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
