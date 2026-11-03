/* global console, process */
/**
 * Moves the local qaroo_cms database to MongoDB Atlas.
 *
 * Written against the mongodb driver that mongoose already depends on, because
 * the mongodump/mongorestore CLI tools are not installed here. Three commands:
 *
 *   node tools/migrate-to-atlas.mjs dump      # local -> backend/backups/<stamp>/
 *   node tools/migrate-to-atlas.mjs restore   # backup -> Atlas
 *   node tools/migrate-to-atlas.mjs verify    # compare the two, collection by collection
 *
 * The source is MONGODB_URI (or the local default). The target is ATLAS_URI,
 * which you set in backend/.env - it is never printed, logged or echoed, and the
 * script refuses to treat a non-Atlas string as a target so a mistyped value
 * cannot overwrite the local database.
 *
 * Documents are written as Extended JSON, so ObjectIds, Dates and Decimals
 * survive the round trip instead of degrading to strings.
 *
 * `restore` refuses to write into a non-empty target unless --force is passed,
 * so running it twice cannot silently duplicate records.
 */

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';

// An Atlas mongodb+srv:// URI needs a DNS SRV lookup, and Node uses its own
// resolver rather than the OS one. Some routers/networks refuse that lookup
// (querySrv ECONNREFUSED) even though the rest of the system resolves fine, so
// when an SRV URI is in play we borrow a public resolver by default. Override
// with DNS_SERVERS=192.168.1.1 or DNS_SERVERS=off to use the system resolver.
{
  const usesSrv = (process.env.MONGODB_URI || '').startsWith('mongodb+srv://')
    || (process.env.ATLAS_URI || '').startsWith('mongodb+srv://');
  const setting = process.env.DNS_SERVERS ?? (usesSrv ? '8.8.8.8,1.1.1.1' : '');
  if (setting && setting.toLowerCase() !== 'off') {
    const servers = setting.split(',').map((s) => s.trim()).filter(Boolean);
    if (servers.length) {
      dns.setServers(servers);
      console.log(`dns   : using ${servers.join(', ')}`);
    }
  }
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(HERE, '../backups');

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qaroo_cms';
const ATLAS_URI = process.env.ATLAS_URI || '';
const command = process.argv[2];
const force = process.argv.includes('--force');

/** The database name inside a connection string, without exposing the rest. */
const dbNameOf = (uri) => {
  const after = uri.includes('@') ? uri.split('@')[1] : uri.split('://')[1] || '';
  return (after.split('/')[1] || '').split('?')[0] || 'qaroo_cms';
};

/** A description safe to print: scheme and host only, never credentials. */
const describe = (uri) => {
  const scheme = uri.split('://')[0];
  const after = uri.includes('@') ? uri.split('@')[1] : uri.split('://')[1] || '';
  const host = after.split('/')[0];
  return `${scheme}://${scheme === 'mongodb+srv' ? host.replace(/^[^.]+/, '<cluster>') : host}/${dbNameOf(uri)}`;
};

const isAtlas = (uri) => uri.startsWith('mongodb+srv://') || /mongodb\.net/i.test(uri);

const connect = async (uri) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  return client;
};

/** Latest dump directory, or the one named on the command line. */
const resolveBackup = () => {
  const named = process.argv.find((a) => a.startsWith('--from='));
  if (named) return path.resolve(BACKUP_ROOT, named.slice(7));
  if (!fs.existsSync(BACKUP_ROOT)) return null;
  const dirs = fs.readdirSync(BACKUP_ROOT).filter((d) => fs.statSync(path.join(BACKUP_ROOT, d)).isDirectory()).sort();
  return dirs.length ? path.join(BACKUP_ROOT, dirs[dirs.length - 1]) : null;
};

// ------------------------------------------------------------------ dump ----
async function dump() {
  console.log(`source: ${describe(LOCAL_URI)}`);
  const client = await connect(LOCAL_URI);
  const db = client.db(dbNameOf(LOCAL_URI));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const out = path.join(BACKUP_ROOT, stamp);
  fs.mkdirSync(out, { recursive: true });

  const collections = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.'));
  const manifest = { takenAt: new Date().toISOString(), database: dbNameOf(LOCAL_URI), collections: {} };

  for (const name of collections.sort()) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(out, `${name}.json`), EJSON.stringify(docs, undefined, 2), 'utf8');
    // Indexes are recreated by Mongoose on first connect, but recording them
    // makes it possible to tell afterwards whether anything was lost.
    const indexes = await db.collection(name).indexes();
    manifest.collections[name] = { count: docs.length, indexes: indexes.map((i) => i.name) };
    console.log(`  ${String(docs.length).padStart(5)} docs  ${name}`);
  }

  fs.writeFileSync(path.join(out, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await client.close();

  const total = Object.values(manifest.collections).reduce((a, c) => a + c.count, 0);
  console.log(`\n${collections.length} collections, ${total} documents`);
  console.log(`written to ${out}`);
  console.log('\nThis dump contains job applications and contact messages - personal');
  console.log('data. backend/backups/ is gitignored; keep it off shared storage.');
}

// --------------------------------------------------------------- restore ----
async function restore() {
  if (!ATLAS_URI) throw new Error('ATLAS_URI is not set in backend/.env');
  if (!isAtlas(ATLAS_URI)) throw new Error('ATLAS_URI does not look like an Atlas connection string (expected mongodb+srv:// or *.mongodb.net)');

  const from = resolveBackup();
  if (!from) throw new Error('no dump found - run `dump` first');
  const manifest = JSON.parse(fs.readFileSync(path.join(from, '_manifest.json'), 'utf8'));

  console.log(`dump  : ${from}`);
  console.log(`target: ${describe(ATLAS_URI)}`);

  const client = await connect(ATLAS_URI);
  const db = client.db(dbNameOf(ATLAS_URI));

  const existing = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.'));
  let occupied = 0;
  for (const name of existing) occupied += await db.collection(name).countDocuments();
  if (occupied > 0 && !force) {
    await client.close();
    throw new Error(`target already holds ${occupied} documents across ${existing.length} collections. Re-run with --force to insert anyway.`);
  }

  let written = 0;
  for (const [name, info] of Object.entries(manifest.collections)) {
    const docs = EJSON.parse(fs.readFileSync(path.join(from, `${name}.json`), 'utf8'));
    if (docs.length === 0) { console.log(`      0 docs  ${name} (skipped)`); continue; }
    // ordered:false so one bad document does not abort the rest.
    const res = await db.collection(name).insertMany(docs, { ordered: false });
    written += res.insertedCount;
    const flag = res.insertedCount === info.count ? '' : `  <- expected ${info.count}`;
    console.log(`  ${String(res.insertedCount).padStart(5)} docs  ${name}${flag}`);
  }

  await client.close();
  console.log(`\n${written} documents written. Run \`verify\` next.`);
}

// ---------------------------------------------------------------- verify ----
async function verify() {
  if (!ATLAS_URI) throw new Error('ATLAS_URI is not set in backend/.env');
  console.log(`local : ${describe(LOCAL_URI)}`);
  console.log(`atlas : ${describe(ATLAS_URI)}\n`);

  const a = await connect(LOCAL_URI);
  const b = await connect(ATLAS_URI);
  const dbA = a.db(dbNameOf(LOCAL_URI));
  const dbB = b.db(dbNameOf(ATLAS_URI));

  const names = new Set([
    ...(await dbA.listCollections().toArray()).map((c) => c.name),
    ...(await dbB.listCollections().toArray()).map((c) => c.name),
  ].filter((n) => !n.startsWith('system.')));

  console.log('collection                 local   atlas  match');
  let mismatches = 0;
  for (const name of [...names].sort()) {
    const ca = await dbA.collection(name).countDocuments();
    const cb = await dbB.collection(name).countDocuments();
    const same = ca === cb;
    if (!same) mismatches += 1;
    console.log(`  ${name.padEnd(24)}${String(ca).padStart(5)}${String(cb).padStart(8)}  ${same ? 'yes' : 'NO'}`);
  }

  // A count match is not proof the contents came across, so compare the ids of
  // one collection document-for-document.
  const sample = [...names].find((n) => n === 'mous') || [...names][0];
  if (sample) {
    const ids = async (db) => (await db.collection(sample).find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)).sort();
    const [ia, ib] = [await ids(dbA), await ids(dbB)];
    const identical = ia.length === ib.length && ia.every((v, i) => v === ib[i]);
    console.log(`\nid-for-id check on "${sample}": ${identical ? 'identical' : 'DIFFERENT'} (${ia.length} vs ${ib.length})`);
    if (!identical) mismatches += 1;
  }

  await a.close();
  await b.close();
  console.log(`\n${mismatches ? `${mismatches} MISMATCH(ES) - do not switch over yet` : 'every collection matches - safe to switch MONGODB_URI to Atlas'}`);
  if (mismatches) process.exitCode = 1;
}

const commands = { dump, restore, verify };
if (!commands[command]) {
  console.log('usage: node tools/migrate-to-atlas.mjs <dump|restore|verify> [--force] [--from=<stamp>]');
  process.exit(1);
}
try {
  await commands[command]();
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
