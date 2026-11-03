import app from '../server/app.js';

export default function handler(req, res) {
  // Normalize req.url so Express routes matching /api/* always resolve
  // regardless of how Vercel rewrites the path internally.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
