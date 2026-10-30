/**
 * Vercel serverless entry point for the API.
 *
 * A catch-all filename, not api/index.js, deliberately: with [...path] every
 * request under /api/* reaches this function with its original URL intact, so
 * Express sees /api/auth/login and its own mounts match. A plain api/index.js
 * would need a rewrite in vercel.json, and a rewrite replaces the path the
 * function receives - Express would see "/api" for every request and nothing
 * would route.
 *
 * Nothing here calls listen(). Vercel invokes the exported handler per request;
 * an Express app is already a (req, res) function, so it can be handed over
 * directly once the database is up.
 */

import app from '../app.js';
import { connectLazy } from '../config/db.js';
import validateEnv from '../config/validateEnv.js';

// Validated once per cold start. It cannot exit the process the way server.js
// does - that would kill the container mid-request - so a fatal
// misconfiguration is remembered and returned as a 500 with a clear message
// instead of failing obscurely on the first database call.
let envError = null;
{
  const { errors, warnings } = validateEnv();
  for (const w of warnings) console.warn(`[env] ${w}`);
  if (errors.length) {
    envError = errors.join('; ');
    console.error(`[env] Configuration error(s): ${envError}`);
  }
}

export default async function handler(req, res) {
  if (envError) {
    res.status(500).json({
      success: false,
      message: 'Server is misconfigured. See the deployment logs.',
    });
    return;
  }

  try {
    await connectLazy();
  } catch (err) {
    // The most common cause by far is the Atlas IP access list: a serverless
    // platform's egress is not a fixed address, so 0.0.0.0/0 is required.
    console.error(`[db] ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Database unavailable. Please try again shortly.',
    });
    return;
  }

  return app(req, res);
}
