/* global console, process */
/**
 * Rewrites a stored site origin across the database.
 *
 * The seeds write an absolute `canonicalUrl` onto business solutions, learning
 * programmes and job postings, so changing the domain in the source leaves the
 * live records pointing at the old one. SEO fields are served straight to
 * crawlers, so a stale value here is as damaging as a stale one in index.html.
 *
 *   node tools/retarget-domain.mjs                 # dry run, shows what would change
 *   node tools/retarget-domain.mjs --apply         # perform the rewrite
 *   node tools/retarget-domain.mjs --from=https://old.example --apply
 *
 * Matching is on the origin prefix only, so paths and slugs are preserved. The
 * rewrite is idempotent: running it twice changes nothing the second time.
 */

import dns from 'node:dns';
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { SITE_URL } from '../config/site.js';

// Node's own resolver is used for mongodb+srv:// SRV lookups and some networks
// refuse it even when the rest of the system resolves fine.
{
  const usesSrv = (process.env.MONGODB_URI || '').startsWith('mongodb+srv://');
  const setting = process.env.DNS_SERVERS ?? (usesSrv ? '8.8.8.8,1.1.1.1' : '');
  if (setting && setting.toLowerCase() !== 'off') {
    const servers = setting.split(',').map((s) => s.trim()).filter(Boolean);
    if (servers.length) dns.setServers(servers);
  }
}

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=');
const apply = process.argv.includes('--apply');
const FROM = (arg('from') || 'https://www.qarootech.in').replace(/\/+$/, '');
const TO = (arg('to') || SITE_URL).replace(/\/+$/, '');

const URI = process.env.MONGODB_URI;
if (!URI) { console.error('MONGODB_URI is not set'); process.exit(1); }
if (FROM === TO) { console.error(`--from and --to are both ${TO}; nothing to do`); process.exit(1); }

// Every string field that can hold an absolute site URL.
const FIELDS = ['canonicalUrl', 'ogUrl', 'ogImage', 'url'];

const describe = (uri) => {
  const scheme = uri.split('://')[0];
  const after = uri.includes('@') ? uri.split('@')[1] : uri.split('://')[1] || '';
  return `${scheme}://${after.split('/')[0].replace(/^[^.]+\./, '<cluster>.')}`;
};

console.log(`database : ${describe(URI)}`);
console.log(`rewrite  : ${FROM}  ->  ${TO}`);
console.log(`mode     : ${apply ? 'APPLY' : 'dry run (pass --apply to write)'}\n`);

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db();

const collections = (await db.listCollections().toArray())
  .map((c) => c.name)
  .filter((n) => !n.startsWith('system.'))
  .sort();

let totalDocs = 0;
let totalFields = 0;

for (const name of collections) {
  const col = db.collection(name);
  // Filtered in JS rather than with a $regex built from a string: escaping a
  // URL into a safe pattern is easy to get subtly wrong, and these collections
  // are small enough that reading them is cheaper than the risk.
  const all = await col.find({}).toArray();
  const docs = all.filter((d) => FIELDS.some((f) => typeof d[f] === 'string' && d[f].startsWith(FROM)));
  if (!docs.length) continue;

  let fieldsHere = 0;
  for (const doc of docs) {
    const set = {};
    for (const f of FIELDS) {
      if (typeof doc[f] === 'string' && doc[f].startsWith(FROM)) {
        set[f] = TO + doc[f].slice(FROM.length);
        fieldsHere += 1;
      }
    }
    if (!Object.keys(set).length) continue;
    if (apply) await col.updateOne({ _id: doc._id }, { $set: set });
  }

  console.log(`  ${String(docs.length).padStart(4)} docs, ${fieldsHere} field(s)  ${name}`);
  totalDocs += docs.length;
  totalFields += fieldsHere;
}

await client.close();

if (!totalDocs) {
  console.log('  nothing matched - the database already uses the new origin');
} else {
  console.log(`\n${totalFields} field(s) across ${totalDocs} document(s) ${apply ? 'rewritten' : 'would be rewritten'}`);
  if (!apply) console.log('Re-run with --apply to write the change.');
}
