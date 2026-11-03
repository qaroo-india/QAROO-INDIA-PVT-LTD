/**
 * Entry point for local development and standalone server execution.
 *
 * Imports the unified Express app from server/app.js.
 */

import 'dotenv/config';

import app from './server/app.js';
import validateEnv from './server/config/validateEnv.js';

// Fail fast on misconfigured environment.
const { errors: envErrors, warnings: envWarnings } = validateEnv();
for (const w of envWarnings) console.warn(`[env] ${w}`);
if (envErrors.length > 0) {
  console.error('[env] Configuration error(s):');
  for (const e of envErrors) console.error(`  - ${e}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const where = HOST === '127.0.0.1' ? 'loopback only' : `all interfaces (${HOST})`;
  console.log(`Qaroo India Private Limited CMS backend listening on port ${PORT} - ${where}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});

export default app;
