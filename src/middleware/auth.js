const AUTH_MODE = process.env.AUTH_MODE || 'apikey';
const API_KEY = process.env.API_KEY || 'changeme';

export default function authMiddleware(req, res, next) {
  if (AUTH_MODE === 'none') return next();
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'Missing x-api-key header' });
  if (key !== API_KEY) return res.status(401).json({ error: 'Invalid API key' });
  next();
}
