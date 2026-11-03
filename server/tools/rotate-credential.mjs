/* global console, process */
/**
 * Rotates a credential in the local env files, then proves the new one works.
 *
 *   node tools/rotate-credential.mjs mongo     # Atlas database user password
 *   node tools/rotate-credential.mjs email     # support@qaroo.in mailbox password
 *
 * Rotate the credential at the provider FIRST (Atlas, or GoDaddy webmail), then
 * run this to update the files and verify.
 *
 * Why this exists rather than editing .env by hand:
 *
 *  - A MongoDB connection string carries the password inside the userinfo
 *    section, so any of : / ? # [ ] @ % must be percent-encoded. The current
 *    password begins with "@" and is stored as "%40...". Pasting a new password
 *    in raw is the single most common way to break the URI, and the failure
 *    looks like an authentication error rather than a syntax one.
 *  - The new password is read from stdin with echo off, so it never lands in
 *    shell history, in the process list, or in this file.
 *  - The old file is backed up, the change is verified against the real
 *    service, and a failed verification rolls the file back - so a bad paste
 *    cannot leave the app unable to start.
 *
 * Nothing here ever prints a credential.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(HERE, '..');

const what = process.argv[2];
if (!['mongo', 'email'].includes(what)) {
  console.log('usage: node tools/rotate-credential.mjs <mongo|email>');
  process.exit(1);
}

/** Reads a line from the terminal without echoing it. */
function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('stdin is not a terminal; run this directly in a shell so the input can be hidden'));
      return;
    }
    process.stdout.write(prompt);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Swallow the echoed characters rather than printing them.
    const onData = () => { readline.moveCursor(process.stdout, 0, 0); readline.clearLine(process.stdout, 1); };
    process.stdin.on('data', onData);
    rl.question('', (answer) => {
      process.stdin.off('data', onData);
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

/** Env files that may carry this credential. Missing ones are skipped. */
const TARGETS = ['.env', '.env.production']
  .map((f) => path.join(BACKEND, f))
  .filter((p) => fs.existsSync(p));

if (!TARGETS.length) {
  console.log('No .env or .env.production found in backend/. Nothing to update.');
  process.exit(1);
}

/** Replaces KEY=... in place, preserving every other line and the ordering. */
function setKey(body, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(body) ? body.replace(re, line) : `${body.replace(/\s*$/, '')}\n${line}\n`;
}

/** Swaps the password inside a mongodb connection string. */
function reauthorise(uri, rawPassword) {
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@]*)@(.+)$/);
  if (!m) return null;
  // encodeURIComponent escapes every character MongoDB requires here,
  // including % itself, so an already-encoded value is not double-escaped by
  // accident - we always start from the raw password the user typed.
  return `${m[1]}${m[2]}:${encodeURIComponent(rawPassword)}@${m[4]}`;
}

const backups = [];
const restore = () => {
  for (const { file, body } of backups) fs.writeFileSync(file, body, 'utf8');
};

async function main() {
  const label = what === 'mongo' ? 'Atlas database user' : 'support@qaroo.in mailbox';
  console.log(`Rotating: ${label}`);
  console.log('Change it at the provider first, then paste the NEW value here.');
  console.log('Input is hidden.\n');

  const secret = (await readSecret('New password: ')).trim();
  if (!secret) { console.log('Nothing entered; aborted.'); process.exit(1); }
  if (secret.length < 8) { console.log('That is shorter than 8 characters; aborted.'); process.exit(1); }

  const confirm = (await readSecret('Confirm:      ')).trim();
  if (secret !== confirm) { console.log('The two entries differ; aborted. Nothing was changed.'); process.exit(1); }

  // ---------------------------------------------------------- write ----
  for (const file of TARGETS) {
    const body = fs.readFileSync(file, 'utf8');
    backups.push({ file, body });

    let next = body;
    if (what === 'email') {
      next = setKey(next, 'EMAIL_PASSWORD', secret);
    } else {
      let touched = 0;
      for (const key of ['MONGODB_URI', 'ATLAS_URI']) {
        const cur = new RegExp(`^${key}=(.*)$`, 'm').exec(body);
        if (!cur) continue;
        const updated = reauthorise(cur[1].trim(), secret);
        if (!updated) {
          console.log(`  ${path.basename(file)}: ${key} has no embedded credentials, left alone`);
          continue;
        }
        next = setKey(next, key, updated);
        touched += 1;
      }
      if (!touched) console.log(`  ${path.basename(file)}: no connection string to update`);
    }

    if (next !== body) {
      fs.writeFileSync(file, next, 'utf8');
      console.log(`  updated ${path.basename(file)}`);
    }
  }

  // --------------------------------------------------------- verify ----
  console.log('\nVerifying against the real service...');

  // Re-read the file we just wrote rather than trusting what we think we wrote.
  const env = {};
  for (const line of fs.readFileSync(TARGETS[0], 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }

  if (what === 'mongo') {
    const uri = env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing after the update');
    if (uri.startsWith('mongodb+srv://')) dns.setServers(['8.8.8.8', '1.1.1.1']);
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
    try {
      await client.connect();
      const n = (await client.db().listCollections().toArray()).length;
      await client.close();
      console.log(`  OK - connected, ${n} collections visible.`);
    } catch (err) {
      const msg = String(err.message || err);
      if (/Authentication failed|bad auth/i.test(msg)) {
        throw new Error('Atlas rejected the new password. Check it was saved in Atlas, and that you pasted it exactly.');
      }
      if (/alert internal error|ServerSelection|ETIMEDOUT/i.test(msg)) {
        throw new Error('Could not reach Atlas at all - this is the Network Access allowlist, not the password. Add this machine\'s IP, then re-run.');
      }
      throw new Error(msg.split('\n')[0]);
    }
  } else {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env.EMAIL_PORT) || 587;
    const t = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port,
      secure: env.EMAIL_SECURE === 'true',
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
    });
    try {
      await t.verify();
      console.log(`  OK - ${env.EMAIL_HOST}:${port} accepted the new credential.`);
    } catch (err) {
      const msg = String(err.message || err);
      if (/invalid login|535|534|authentication failed/i.test(msg)) {
        throw new Error('The mail server rejected the new password. GoDaddy uses the mailbox password - confirm it by signing in to webmail.');
      }
      throw new Error(msg.split('\n')[0]);
    }
  }

  console.log('\nDone. Remaining steps:');
  if (what === 'mongo') {
    console.log('  - update MONGODB_URI wherever the app is hosted (the host\'s env settings)');
    console.log('  - the old password stops working immediately, so redeploy or restart the backend');
  } else {
    console.log('  - update EMAIL_PASSWORD in the host\'s env settings');
    console.log('  - restart the backend, or verification and reset mail will fail to send');
  }
  console.log('  - run: NODE_ENV=production node tools/preflight.mjs');
}

try {
  await main();
} catch (err) {
  console.log(`\nFAILED: ${err.message}`);
  if (backups.length) {
    restore();
    console.log('Rolled the env file(s) back; nothing was left half-changed.');
  }
  process.exit(1);
}
