/**
 * Long-running entry point: local development, Render, Railway, EC2.
 *
 * The app itself is built in app.js. This file owns only the things that make
 * sense for a process that starts once and stays up - validating the
 * environment and refusing to boot, opening the database connection eagerly,
 * and binding a port.
 *
 * Vercel uses api/[...path].js instead, which never calls listen().
 */

import 'dotenv/config';

import app from './app.js';
import { connectDB } from './config/db.js';
import validateEnv from './config/validateEnv.js';

// Fail fast on a misconfigured environment before opening the port.
const { errors: envErrors, warnings: envWarnings } = validateEnv();
for (const w of envWarnings) console.warn(`[env] ${w}`);
if (envErrors.length > 0) {
  console.error('[env] Configuration error(s):');
  for (const e of envErrors) console.error(`  - ${e}`);
  process.exit(1);
}

connectDB();

const PORT = process.env.PORT || 5000;
// Which interfaces to accept connections on.
//
// The default binds everywhere, which is what a managed host (Render, Railway)
// requires in order to route traffic to the container. Behind a reverse proxy
// on a machine you own - nginx on EC2 - set HOST=127.0.0.1 so the port is
// reachable only from the proxy and cannot be hit directly from the internet
// even if a security group is left open.
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const where = HOST === '127.0.0.1' ? 'loopback only' : `all interfaces (${HOST})`;
  console.log(`Qaroo India Private Limited CMS backend listening on port ${PORT} - ${where}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});
