import mongoose from 'mongoose';
import dns from 'node:dns';

// Some routers/networks refuse Node's SRV DNS lookups (querySrv ECONNREFUSED)
// even though the OS resolver works, which breaks mongodb+srv:// on this machine.
const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];

async function open(uri) {
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qaroo_cms';
  try {
    const conn = await open(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    const srvIssue = /querySrv|ECONNREFUSED|ENOTFOUND|ESERVFAIL|ETIMEOUT/i.test(err.message);
    if (uri.startsWith('mongodb+srv://') && srvIssue) {
      console.warn(`MongoDB SRV lookup failed (${err.message}); retrying via public DNS ${PUBLIC_DNS.join(', ')}`);
      try {
        dns.setServers(PUBLIC_DNS);
        await mongoose.disconnect().catch(() => {});
        const conn = await open(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
      } catch (retryErr) {
        console.error(`MongoDB connection error: ${retryErr.message}`);
        process.exit(1);
      }
    }
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Connection for a serverless invocation.
 *
 * Differs from connectDB in three ways that matter on Vercel:
 *
 *  - It is cached. A warm function reuses the open connection instead of
 *    dialling again, and the in-flight promise is shared so a burst of
 *    concurrent requests on one cold instance opens exactly one connection
 *    rather than one each.
 *  - The pool is small. Each instance keeps its own pool, and the platform may
 *    run many instances, so the default pool size multiplied by the instance
 *    count will exhaust an Atlas cluster's connection limit. Five per instance
 *    leaves room.
 *  - It throws instead of calling process.exit. Killing the process on a
 *    serverless platform turns one failed request into a failed container and
 *    loses the chance to return a useful error.
 */
let cached = null;

export function connectLazy() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (cached) return cached;

  const uri = process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new Error('MONGODB_URI is not set'));

  // Atlas needs an SRV lookup and some runtimes resolve it unreliably; setting
  // a public resolver up front avoids a failed first request on a cold start.
  if (uri.startsWith('mongodb+srv://')) {
    try { dns.setServers(PUBLIC_DNS); } catch { /* resolver already fine */ }
  }

  cached = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL || 5),
      // Surface a missing connection as an error rather than queueing the
      // operation until the request times out with no explanation.
      bufferCommands: false,
    })
    .then((conn) => conn.connection)
    .catch((err) => {
      // Clear the cache so the next invocation retries rather than replaying a
      // rejected promise for the lifetime of the instance.
      cached = null;
      throw err;
    });

  return cached;
}
