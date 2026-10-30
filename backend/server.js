import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import validateEnv from './config/validateEnv.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

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

// Fail fast on a misconfigured environment before opening the port.
const { errors: envErrors, warnings: envWarnings } = validateEnv();
for (const w of envWarnings) console.warn(`[env] ${w}`);
if (envErrors.length > 0) {
  console.error('[env] Configuration error(s):');
  for (const e of envErrors) console.error(`  - ${e}`);
  process.exit(1);
}

connectDB();

// Behind a reverse proxy (Nginx/cPanel/etc.) this restores the real client IP
// for correct rate limiting and logging.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
// Allow a comma-separated CLIENT_URL list (or a single origin) while keeping
// credentials-based CORS locked to explicitly-listed origins.
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Broad abuse protection across every API route.
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Stricter cap on write-capable modules so brute-force/abuse is blunted while
// still allowing normal content reads over the same mounts.
const writeApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.get('/api/health', (req, res) =>
    res.json({ success: true, message: 'Qaroo India Private Limited CMS API is running' })
);

app.use('/api', globalApiLimiter);

app.use('/api/stats', statsRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admins', writeApiLimiter, adminRoutes);
app.use('/api/mous', writeApiLimiter, mouRoutes);
app.use('/api/content', pageRoutes);
app.use('/api/csr', writeApiLimiter, csrRoutes);
app.use('/api/learning', writeApiLimiter, learningRoutes);
app.use('/api/business-solutions', writeApiLimiter, businessSolutionRoutes);
app.use('/api/careers', writeApiLimiter, careerRoutes);
// Applications have their own submit limiter inside the router, like contact.
app.use('/api/applications', applicationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/client-errors', clientErrorRoutes);

// Optional single-process deployment: serve the built React app (repo root
// dist/) from the backend with an SPA fallback so direct visits or refreshes on
// nested routes (e.g. /learning-programs/<slug>) resolve to index.html.
// Set SERVE_STATIC=true only when the frontend is NOT hosted separately.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
if (process.env.SERVE_STATIC === 'true' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Which interfaces to accept connections on.
//
// The default binds everywhere, which is what a managed host (Render, Railway,
// Amplify's compute) requires in order to route traffic to the container. Behind
// a reverse proxy on a machine you own - nginx on EC2 - set HOST=127.0.0.1 so
// the port is reachable only from the proxy on the same host and cannot be hit
// directly from the internet even if a security group is left open.
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const where = HOST === '127.0.0.1' ? 'loopback only' : `all interfaces (${HOST})`;
  console.log(`Qaroo India Private Limited CMS backend listening on port ${PORT} - ${where}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});
