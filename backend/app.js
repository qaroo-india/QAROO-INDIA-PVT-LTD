/**
 * Builds the Express app, and nothing else.
 *
 * Deliberately free of side effects: it does not read the environment for
 * validation, open a database connection, bind a port, or call process.exit.
 * That is what lets the same app serve two very different runtimes:
 *
 *   server.js            long-running process (local, Render, EC2) - validates
 *                        the environment, connects, then listens
 *   api/[...path].js     Vercel serverless - connects lazily per invocation and
 *                        hands the request straight to this app
 *
 * Importing this module must stay cheap, because on serverless it runs on every
 * cold start.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter, authLimiter, writeLimiter } from './middleware/rateLimiters.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mouRoutes from './routes/mouRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import csrRoutes from './routes/csrRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import businessSolutionRoutes from './routes/businessSolutionRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import clientErrorRoutes from './routes/clientErrorRoutes.js';

const app = express();

// Behind a reverse proxy - nginx, cPanel, or Vercel's edge - this restores the
// real client IP so rate limiting and logging are not all attributed to the
// proxy. 1 means "trust exactly one hop": trusting more would let a caller
// prepend its own X-Forwarded-For and choose the address it is limited by.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());

// Allow a comma-separated CLIENT_URL list (or a single origin) while keeping
// credentials-based CORS locked to explicitly-listed origins. Read per request
// rather than at import time so a serverless cold start always sees the current
// environment.
const allowedOrigins = () =>
  String(process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Liveness. Above the limiters so a monitor cannot be rate-limited out, and so
// it answers even when the database is unreachable.
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Qaroo India Private Limited CMS API is running' })
);

app.use('/api', apiLimiter);

app.use('/api/stats', statsRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admins', writeLimiter, adminRoutes);
app.use('/api/mous', writeLimiter, mouRoutes);
app.use('/api/content', pageRoutes);
app.use('/api/csr', writeLimiter, csrRoutes);
app.use('/api/learning', writeLimiter, learningRoutes);
app.use('/api/business-solutions', writeLimiter, businessSolutionRoutes);
app.use('/api/careers', writeLimiter, careerRoutes);
// Applications have their own submit limiter inside the router, like contact.
app.use('/api/applications', applicationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/client-errors', clientErrorRoutes);

// Optional single-process deployment: serve the built React app (repo root
// dist/) from the backend with an SPA fallback so direct visits or refreshes on
// nested routes resolve to index.html. Set SERVE_STATIC=true only when the
// frontend is NOT hosted separately - never on serverless, where the frontend
// is served by the platform's CDN and dist/ is not in the function bundle.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../frontend/dist');
if (process.env.SERVE_STATIC === 'true' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
