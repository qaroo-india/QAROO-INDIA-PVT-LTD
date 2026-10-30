/* global console, process, URL */
/**
 * Pre-deployment check. Run it against the environment you are about to deploy
 * with, before the server ever opens a port:
 *
 *   NODE_ENV=production node tools/preflight.mjs
 *
 * validateEnv() already blocks a boot on a fatal misconfiguration. This goes
 * wider: it checks the things that do not stop the server starting but do break
 * the site once it is live - a frontend pointed at the wrong API, an origin
 * missing from the CORS allowlist, a database that cannot be reached, a mail
 * credential that will not authenticate, assets the records reference but that
 * are not on disk.
 *
 * Exit code 0 means every blocking check passed. Nothing here prints a secret.
 */

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

let fail = 0;
let warn = 0;

const pass = (m) => console.log(`  PASS  ${m}`);
const bad = (m) => { console.log(`  FAIL  ${m}`); fail += 1; };
const soft = (m) => { console.log(`  WARN  ${m}`); warn += 1; };
const skip = (m) => console.log(`  SKIP  ${m}`);
const section = (t) => console.log(`\n${t}`);

const isProd = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------- environment ----
section('environment');

if (isProd) pass('NODE_ENV=production (Secure cookies on, 5xx details withheld)');
else bad(`NODE_ENV is "${process.env.NODE_ENV || '(unset)'}" - set it to production for a live deploy`);

{
  const { errors, warnings } = (await import('../config/validateEnv.js')).default();
  errors.forEach((e) => bad(e));
  // Cloudinary is reported separately below, as blocking rather than advisory.
  warnings
    .filter((w) => !/Cloudinary/i.test(w))
    .forEach((w) => soft(w.split('.')[0] + '.'));
  if (!errors.length) pass('validateEnv reports no blocking errors');
}

{
  // Uploaded resumes are the only data on this site that cannot be regenerated.
  // Without object storage they go to the container's local disk, which a
  // redeploy or an autoscale event discards - so this is treated as blocking
  // rather than advisory, with an explicit opt-out for a knowing launch.
  const configured = process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET;
  const accepted = process.env.ALLOW_EPHEMERAL_UPLOADS === 'true';

  if (configured) {
    pass('Cloudinary is configured, so uploads survive a redeploy');
  } else if (!isProd) {
    skip('Cloudinary not configured (fine outside production - uploads go to local disk)');
  } else if (accepted) {
    soft('Cloudinary is not configured and ALLOW_EPHEMERAL_UPLOADS=true. Uploaded resumes WILL be lost on the next redeploy; you have accepted this knowingly.');
  } else {
    bad(
      'Cloudinary is not configured. Uploaded resumes and CMS images go to the local disk and are '
      + 'lost on every redeploy, and job applications cannot be regenerated. Configure it, or set '
      + 'ALLOW_EPHEMERAL_UPLOADS=true to accept the loss deliberately.'
    );
  }
}

{
  // On a host you own, the app should sit behind a proxy on loopback. On a
  // managed platform the opposite is true: binding to loopback makes the
  // container unroutable and the deploy fails its health check.
  const host = process.env.HOST || '0.0.0.0';
  const loopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
  if (loopback) {
    pass(`HOST=${host} - the port is reachable only through a local reverse proxy`);
  } else if (isProd) {
    soft(
      `HOST=${host} binds every interface. Correct on a managed host (Render, Railway, Amplify `
      + 'compute). On an EC2 instance behind nginx, set HOST=127.0.0.1 and keep port 5000 closed '
      + 'in the security group.'
    );
  }
}

// ------------------------------------------------------------- secrets ----
section('secrets');

{
  const s = process.env.JWT_SECRET || '';
  // Random hex draws from 16 symbols, so "distinct characters" would mark a
  // strong generated secret down. Estimate the actual entropy instead:
  // length x log2(alphabet).
  const alphabet = (v) => {
    let n = 0;
    if (/[a-z]/.test(v)) n += 26;
    if (/[A-Z]/.test(v)) n += 26;
    if (/[0-9]/.test(v)) n += 10;
    if (/[^A-Za-z0-9]/.test(v)) n += 20;
    return /^[0-9a-f]+$/i.test(v) ? 16 : n;
  };
  const bits = Math.round(s.length * Math.log2(Math.max(alphabet(s), 2)));
  const generated = /^[0-9a-f]{32,}$/i.test(s) || /^[A-Za-z0-9+/_-]{43,}={0,2}$/.test(s);

  // The bit estimate assumes every character is an independent random draw,
  // which a passphrase violates - so it is reported, never used to pass a
  // secret that does not look machine-generated. Otherwise this check would
  // contradict validateEnv on the same value.
  if (!s) bad('JWT_SECRET is not set');
  else if (s.length < 32) bad(`JWT_SECRET is only ${s.length} chars`);
  else if (generated) pass(`JWT_SECRET is ${s.length} chars, about ${bits} bits of entropy`);
  else soft(`JWT_SECRET is ${s.length} chars but is not a generated hex/base64 value (${bits} bits only if every character is random) - prefer randomBytes(48).toString('hex')`);
}

{
  // A secret that is also sitting in a tracked file is already public.
  const tracked = [];
  for (const rel of ['.env.example', 'backend/.env.example', 'backend/.env.production.example']) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const body = fs.readFileSync(p, 'utf8');
    for (const key of ['JWT_SECRET', 'EMAIL_PASSWORD', 'ADMIN_PASSWORD', 'MONGODB_URI']) {
      const v = process.env[key];
      if (v && v.length > 8 && body.includes(v)) tracked.push(`${key} in ${rel}`);
    }
  }
  if (tracked.length) bad(`a live secret value appears in a tracked template: ${tracked.join(', ')}`);
  else pass('no live secret value appears in a checked-in template');
}

// --------------------------------------------------------------- origins ----
section('origins and CORS');

const origins = String(process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
const apiBase = process.env.VITE_API_BASE_URL || '';

if (!origins.length) bad('CLIENT_URL is empty');
else pass(`CLIENT_URL allows ${origins.length} origin(s): ${origins.join(', ')}`);

{
  // The apex/www pair is the single most common cause of a CORS failure in
  // production: whichever one the user types has to be on the list.
  const hosts = origins
    .map((o) => { try { return new URL(o).host; } catch { return ''; } })
    .filter(Boolean)
    // localhost and 127.0.0.1 have no apex/www distinction.
    .filter((h) => !/^(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/i.test(h));
  const bare = hosts.filter((h) => !h.startsWith('www.'));
  const missing = bare.filter((h) => !hosts.includes(`www.${h}`));
  const missingBare = hosts.filter((h) => h.startsWith('www.') && !hosts.includes(h.slice(4)));
  if (missing.length || missingBare.length) {
    soft(`CLIENT_URL lists only one of the apex/www pair for: ${[...missing, ...missingBare].join(', ')} - add both unless one permanently redirects`);
  } else if (hosts.length) {
    pass('apex and www variants are both covered (or not applicable)');
  }
}

{
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const site = (h) => h.replace(/^www\./, '');
  let apiHost = '';
  try { apiHost = apiBase ? new URL(apiBase).host : ''; } catch { /* ignored */ }
  const frontHosts = origins.map((o) => { try { return new URL(o).host; } catch { return ''; } }).filter(Boolean);
  const crossSite = apiHost && frontHosts.length
    && !frontHosts.some((h) => site(h) === site(apiHost) || site(apiHost).endsWith(`.${site(h)}`) || site(h).endsWith(`.${site(apiHost)}`));

  if (!apiBase) skip('VITE_API_BASE_URL not set here - same-origin deploy, or set at frontend build time');
  else if (crossSite && sameSite !== 'none') {
    bad(`the API (${apiHost}) is cross-site from the frontend but COOKIE_SAMESITE is "${sameSite}" - admin login will log straight back out; set COOKIE_SAMESITE=none`);
  } else if (!crossSite && sameSite === 'none') {
    soft('COOKIE_SAMESITE=none but the API shares the site - "lax" is the tighter choice');
  } else {
    pass(`COOKIE_SAMESITE="${sameSite}" matches the deployment shape`);
  }
}

// -------------------------------------------------------------- database ----
section('database');

{
  const uri = process.env.MONGODB_URI || '';
  if (!uri) bad('MONGODB_URI is not set');
  else if (isProd && uri.includes('127.0.0.1')) bad('MONGODB_URI points at localhost in production');
  else {
    if (uri.startsWith('mongodb+srv://')) {
      const setting = process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1';
      if (setting && setting.toLowerCase() !== 'off') {
        dns.setServers(setting.split(',').map((s) => s.trim()).filter(Boolean));
      }
    }
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
      await client.connect();
      const stats = await client.db().admin().command({ ping: 1 });
      const names = (await client.db().listCollections().toArray()).length;
      await client.close();
      if (stats.ok) pass(`database reachable, ${names} collections`);
    } catch (err) {
      const m = String(err.message || err);
      if (/alert internal error|ETIMEDOUT|ServerSelection/i.test(m)) {
        bad('cannot reach the database - on Atlas this is almost always the Network Access allowlist; add the deploy host\'s outbound IP');
      } else if (/Authentication failed|bad auth/i.test(m)) {
        bad('database refused the credential - check the user and password (a password with @ or / must be percent-encoded in the URI)');
      } else {
        bad(`cannot reach the database: ${m.split('\n')[0]}`);
      }
    }
  }
}

// ------------------------------------------------------------------ mail ----
section('mail');

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  soft('mail is not fully configured - verification and reset emails will be logged to the console instead of sent');
} else {
  try {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(process.env.EMAIL_PORT) || 587;
    const secure = process.env.EMAIL_SECURE === 'true';
    if ((port === 465 && !secure) || (port === 587 && secure)) {
      bad(`EMAIL_PORT=${port} with EMAIL_SECURE=${secure} is the wrong pairing (465 -> true, 587 -> false)`);
    }
    const t = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
    });
    await t.verify();
    pass(`SMTP accepted the credential at ${process.env.EMAIL_HOST}:${port}`);
  } catch (err) {
    soft(`SMTP did not authenticate: ${String(err.message).split('\n')[0]}`);
  }
}

{
  // Authenticating as support@ proves that one mailbox exists. It says nothing
  // about admin@ on the same domain - that is a separate mailbox that has to be
  // created, and if it has not been, every verification code and password-reset
  // email to the super admin bounces with "550 Recipient not found" while
  // sending still looks healthy.
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const sender = (process.env.EMAIL_USER || '').toLowerCase();
  const domainOf = (a) => a.split('@')[1] || '';

  if (!adminEmail) {
    soft('ADMIN_EMAIL is not set, so no super admin is seeded');
  } else if (adminEmail === sender) {
    pass(`ADMIN_EMAIL is the authenticated mailbox (${adminEmail}) - mail to it is deliverable`);
  } else if (sender && domainOf(adminEmail) === domainOf(sender)) {
    soft(
      `ADMIN_EMAIL (${adminEmail}) is a different mailbox from the authenticated sender ` +
        `(${sender}) on the same domain. Confirm it exists as a mailbox, alias or forwarder, ` +
        'or password-reset and verification mail to the super admin will bounce.'
    );
  } else {
    pass(`ADMIN_EMAIL (${adminEmail}) is on an external domain, delivered independently`);
  }
}

// ---------------------------------------------------------------- assets ----
section('build and assets');

{
  const dist = path.join(ROOT, 'dist');
  const index = path.join(dist, 'index.html');
  if (!fs.existsSync(index)) {
    bad('dist/index.html is missing - run `npm run build` in the project root');
  } else {
    const built = fs.statSync(index).mtimeMs;
    // A bundle older than the sources it was built from is the classic
    // "deployed the previous version" mistake.
    let newest = 0;
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|css|html)$/.test(e.name)) newest = Math.max(newest, fs.statSync(p).mtimeMs);
      }
    };
    walk(path.join(ROOT, 'src'));
    newest = Math.max(newest, fs.statSync(path.join(ROOT, 'index.html')).mtimeMs);
    if (newest > built) bad('dist/ is older than src/ - rebuild before deploying');
    else pass('dist/ is newer than the sources it was built from');

    const body = fs.readFileSync(index, 'utf8');
    const stale = body.match(/https:\/\/www\.qarootech\.in/);
    if (stale) bad('the built index.html still references qarootech.in, which has no DNS records');
    else pass('built index.html carries no dead-domain reference');
  }
}

{
  // Every brochure/logo path the seeds publish must exist, or a visitor gets a
  // 404 from a link the CMS says is live.
  const { assetExists } = await import('../seed/assets.js');
  const pub = path.join(ROOT, 'public');
  const missing = [];
  for (const rel of ['robots.txt', 'sitemap.xml', 'logos/qaroo-logo.png']) {
    if (!assetExists('/' + rel)) missing.push(rel);
  }
  if (missing.length) bad(`missing from public/: ${missing.join(', ')}`);
  else pass('robots.txt, sitemap.xml and the logo are present');

  const sm = path.join(pub, 'sitemap.xml');
  if (fs.existsSync(sm)) {
    const xml = fs.readFileSync(sm, 'utf8');
    const { SITE_URL } = await import('../config/site.js');
    const n = (xml.match(/<loc>/g) || []).length;
    if (!xml.includes(SITE_URL)) bad(`sitemap.xml does not use ${SITE_URL} - regenerate it with tools/build-sitemap.mjs`);
    else pass(`sitemap.xml has ${n} URLs on ${SITE_URL}`);
  }
}

// ----------------------------------------------------------------- verdict --
console.log('');
console.log(`${fail} blocking, ${warn} advisory`);
if (fail) {
  console.log('NOT READY - resolve the FAIL lines above.');
  process.exit(1);
}
console.log(warn ? 'READY - advisory items are safe to accept knowingly.' : 'READY.');
