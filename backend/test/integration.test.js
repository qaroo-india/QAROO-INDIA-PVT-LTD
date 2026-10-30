/**
 * In-process integration tests for authentication, authorization and CMS CRUD.
 *
 * This does NOT start the application server. It builds a throwaway Express app
 * from the same routers and middleware server.js mounts, listens on an ephemeral
 * port, and talks to an isolated database that is dropped when the run finishes.
 * The existing api.test.js needs a server already running on :5000; this one
 * needs nothing, so it can run in CI or on a clean checkout.
 *
 *   node --test test/integration.test.js     (or: npm test)
 *
 * Safety: the database name must contain "test" or the run aborts, so a
 * mistyped TEST_MONGODB_URI can never drop real data.
 */

import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import Admin from '../models/Admin.js';
import LearningProgram from '../models/LearningProgram.js';
import ContactMessage from '../models/ContactMessage.js';
import { ALL_PERMISSIONS } from '../utils/permissions.js';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

import authRoutes from '../routes/authRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import learningRoutes from '../routes/learningRoutes.js';
import contactRoutes from '../routes/contactRoutes.js';

const URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/qaroo_cms_test';
if (!/test/i.test(new URL(URI.replace('mongodb://', 'http://')).pathname)) {
  throw new Error(`Refusing to run: test database name must contain "test" (got ${URI})`);
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret-at-least-32-chars-long';
process.env.NODE_ENV = 'test';

let server;
let base;

const SUPER = { email: 'super@test.local', password: 'Sup3rPass!23' };
const LIMITED = { email: 'limited@test.local', password: 'L1mitedPass!23' };
const NOPERMS = { email: 'noperms@test.local', password: 'N0Perms!23456' };

before(async () => {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 });
  await mongoose.connection.dropDatabase();

  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/admins', adminRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/contact', contactRoutes);
  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  // Accounts are created straight through the model so the tests do not depend
  // on the email-verification flow, which needs SMTP.
  await Admin.create({
    name: 'Super', email: SUPER.email, password: SUPER.password,
    role: 'superadmin', permissions: ALL_PERMISSIONS,
    isEmailVerified: true, isApproved: true,
  });
  await Admin.create({
    name: 'Limited', email: LIMITED.email, password: LIMITED.password,
    role: 'admin', permissions: ['learning.read', 'learning.create', 'learning.update', 'contact.read', 'contact.update'],
    isEmailVerified: true, isApproved: true,
  });
  await Admin.create({
    name: 'NoPerms', email: NOPERMS.email, password: NOPERMS.password,
    role: 'admin', permissions: [],
    isEmailVerified: true, isApproved: true,
  });
});

after(async () => {
  // Always tear down, so no port is left bound and no test data survives.
  try { await mongoose.connection.dropDatabase(); } catch { /* already gone */ }
  await mongoose.disconnect();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
});

/** fetch that keeps a cookie jar, the way a browser would. */
function client() {
  let jar = '';
  return async (method, path, body) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(jar ? { Cookie: jar } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const set = res.headers.getSetCookie?.() || [];
    if (set.length) {
      const pairs = new Map(jar ? jar.split('; ').map((c) => [c.split('=')[0], c]) : []);
      for (const c of set) {
        const first = c.split(';')[0];
        const name = first.split('=')[0];
        if (/=;|=$/.test(first)) pairs.delete(name);
        else pairs.set(name, first);
      }
      jar = [...pairs.values()].join('; ');
    }
    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data, jar };
  };
}

const loginAs = async (who) => {
  const c = client();
  const res = await c('POST', '/api/auth/login', { email: who.email, password: who.password });
  assert.equal(res.status, 200, `login failed for ${who.email}: ${JSON.stringify(res.data)}`);
  return c;
};

// ---------------------------------------------------------------- auth ------

test('login rejects an empty body', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/login', {});
  assert.ok(res.status === 400 || res.status === 401, `expected 400/401, got ${res.status}`);
});

test('login rejects a wrong password', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/login', { email: SUPER.email, password: 'wrong-password' });
  assert.equal(res.status, 401);
});

test('login rejects an unknown email', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/login', { email: 'nobody@test.local', password: 'whatever123' });
  assert.equal(res.status, 401);
});

test('login succeeds and sets an httpOnly cookie', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/login', SUPER);
  assert.equal(res.status, 200);
  assert.ok(/accessToken=/.test(res.jar), 'no accessToken cookie was set');
});

test('login never returns the password hash', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/login', SUPER);
  assert.ok(!JSON.stringify(res.data).includes('$2'), 'a bcrypt hash appeared in the login response');
});

test('protected route rejects an absent token', async () => {
  const c = client();
  const res = await c('GET', '/api/auth/me');
  assert.equal(res.status, 401);
});

test('protected route rejects a malformed token', async () => {
  const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: 'Bearer not.a.jwt' } });
  assert.equal(res.status, 401);
});

test('protected route accepts a valid session', async () => {
  const c = await loginAs(SUPER);
  const res = await c('GET', '/api/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.data.data.admin.email, SUPER.email);
});

test('logout ends the session', async () => {
  const c = await loginAs(SUPER);
  assert.equal((await c('GET', '/api/auth/me')).status, 200);
  await c('POST', '/api/auth/logout');
  assert.equal((await c('GET', '/api/auth/me')).status, 401);
});

test('a disabled account cannot use a valid token', async () => {
  const c = await loginAs(NOPERMS);
  await Admin.updateOne({ email: NOPERMS.email }, { isDisabled: true });
  const res = await c('GET', '/api/auth/me');
  assert.equal(res.status, 403);
  await Admin.updateOne({ email: NOPERMS.email }, { isDisabled: false });
});

// ------------------------------------------------------- authorization -----

test('creating content without the permission is refused', async () => {
  const c = await loginAs(NOPERMS);
  const res = await c('POST', '/api/learning', { title: 'Should not be created' });
  assert.equal(res.status, 403);
});

test('creating content with the permission is allowed', async () => {
  const c = await loginAs(LIMITED);
  const res = await c('POST', '/api/learning', { title: 'Permitted Program' });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  await LearningProgram.deleteOne({ _id: res.data.data.program._id });
});

test('deleting is refused when only create/update were granted', async () => {
  const sup = await loginAs(SUPER);
  const made = await sup('POST', '/api/learning', { title: 'Delete Me Please' });
  const id = made.data.data.program._id;

  const limited = await loginAs(LIMITED);
  const res = await limited('DELETE', `/api/learning/${id}`);
  assert.equal(res.status, 403, 'an admin without learning.delete was allowed to delete');

  await LearningProgram.deleteOne({ _id: id });
});

test('admin management is Super Admin only', async () => {
  const c = await loginAs(LIMITED);
  const res = await c('GET', '/api/admins');
  assert.equal(res.status, 403);
});

test('Super Admin can list admins', async () => {
  const c = await loginAs(SUPER);
  const res = await c('GET', '/api/admins');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data.admins));
});

test('contact.update is grantable (regression: was missing from the catalogue)', async () => {
  const sup = await loginAs(SUPER);
  const limited = await Admin.findOne({ email: LIMITED.email });
  const res = await sup('PUT', `/api/admins/${limited._id}/permissions`, {
    permissions: ['contact.read', 'contact.update'],
  });
  assert.equal(res.status, 200);
  assert.ok(
    res.data.data.admin.permissions.includes('contact.update'),
    'contact.update was filtered out on save - it is not in ALL_PERMISSIONS'
  );
  // Restore the fixture's permissions for the remaining tests.
  await Admin.updateOne(
    { email: LIMITED.email },
    { permissions: ['learning.read', 'learning.create', 'learning.update', 'contact.read', 'contact.update'] }
  );
});

// -------------------------------------------------- draft disclosure -------

test('an unpublished program is not readable by id without authentication', async () => {
  const sup = await loginAs(SUPER);
  const made = await sup('POST', '/api/learning', { title: 'Secret Draft', status: 'draft' });
  const id = made.data.data.program._id;
  await LearningProgram.updateOne({ _id: id }, { status: 'draft' });

  const anon = client();
  const res = await anon('GET', `/api/learning/${id}`);
  assert.equal(res.status, 404, 'an unauthenticated caller read an unpublished program by id');

  await LearningProgram.deleteOne({ _id: id });
});

test('an unpublished program is not listed for an admin without the read permission', async () => {
  const sup = await loginAs(SUPER);
  const made = await sup('POST', '/api/learning', { title: 'Draft For Listing' });
  const id = made.data.data.program._id;
  await LearningProgram.updateOne({ _id: id }, { status: 'draft' });

  const noperms = await loginAs(NOPERMS);
  const res = await noperms('GET', '/api/learning');
  assert.equal(res.status, 200);
  const ids = res.data.data.programs.map((p) => String(p._id));
  assert.ok(!ids.includes(String(id)), 'a draft was listed for an admin with no learning.read');

  await LearningProgram.deleteOne({ _id: id });
});

test('an admin with the read permission does see drafts', async () => {
  const sup = await loginAs(SUPER);
  const made = await sup('POST', '/api/learning', { title: 'Visible Draft' });
  const id = made.data.data.program._id;
  await LearningProgram.updateOne({ _id: id }, { status: 'draft' });

  const limited = await loginAs(LIMITED);
  const res = await limited('GET', '/api/learning');
  const ids = res.data.data.programs.map((p) => String(p._id));
  assert.ok(ids.includes(String(id)), 'an admin holding learning.read could not see a draft');

  await LearningProgram.deleteOne({ _id: id });
});

// --------------------------------------------------------- CMS CRUD --------

test('full CRUD lifecycle on a learning program', async () => {
  const c = await loginAs(SUPER);

  const created = await c('POST', '/api/learning', { title: 'Lifecycle Program', desc: 'first' });
  assert.equal(created.status, 201);
  const id = created.data.data.program._id;
  assert.ok(created.data.data.program.slug, 'no slug was generated');

  const read = await c('GET', `/api/learning/${id}`);
  assert.equal(read.status, 200);
  assert.equal(read.data.data.program.title, 'Lifecycle Program');

  const updated = await c('PUT', `/api/learning/${id}`, { title: 'Lifecycle Program v2' });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.program.title, 'Lifecycle Program v2');

  // New content starts as a draft (normalizeProgram forces it), so the public
  // slug route must refuse it until it is published. /publish is a toggle.
  //
  // The slug is read back from the update response, not the create response:
  // updateProgram recomputes it from the title whenever the body carries no
  // explicit slug, so renaming a record changes its public URL.
  const slug = updated.data.data.program.slug;
  assert.equal(created.data.data.program.status, 'draft', 'new content should start as a draft');

  const whileDraft = await c('GET', `/api/learning/by-slug/${slug}`);
  assert.equal(whileDraft.status, 404, 'a draft was served by the public slug route');

  const published = await c('POST', `/api/learning/${id}/publish`);
  assert.equal(published.status, 200);
  assert.equal(published.data.data.program.status, 'published');

  const bySlug = await c('GET', `/api/learning/by-slug/${slug}`);
  assert.equal(bySlug.status, 200, 'a published program was not reachable by slug');

  // Toggling again takes it back out of the public site.
  const unpublished = await c('POST', `/api/learning/${id}/publish`);
  assert.equal(unpublished.data.data.program.status, 'draft');
  assert.equal((await c('GET', `/api/learning/by-slug/${slug}`)).status, 404);

  const removed = await c('DELETE', `/api/learning/${id}`);
  assert.equal(removed.status, 200);

  const gone = await c('GET', `/api/learning/${id}`);
  assert.equal(gone.status, 404);
});

test('an invalid id is handled, not crashed on', async () => {
  const c = await loginAs(SUPER);
  const res = await c('GET', '/api/learning/not-a-valid-object-id');
  assert.ok(res.status === 404 || res.status === 400, `expected 404/400, got ${res.status}`);
});

// ----------------------------------------------------------- bounds --------

test('a list reports total and honours ?limit', async () => {
  const c = await loginAs(SUPER);
  const ids = [];
  for (const n of [1, 2, 3]) {
    const r = await c('POST', '/api/learning', { title: `Bounded ${n}` });
    ids.push(r.data.data.program._id);
  }

  const all = await c('GET', '/api/learning');
  assert.equal(typeof all.data.total, 'number', 'total was not returned');
  assert.ok(all.data.total >= 3);

  const one = await c('GET', '/api/learning?limit=1');
  assert.equal(one.data.data.programs.length, 1, '?limit was not applied');
  assert.equal(one.data.count, 1);
  assert.ok(one.data.total >= 3, 'total should count every match, not the page');

  for (const id of ids) await LearningProgram.deleteOne({ _id: id });
});

test('a public contact submission is stored bounded', async () => {
  const anon = client();
  const res = await anon('POST', '/api/contact', {
    name: 'A'.repeat(500),
    email: 'flood@test.local',
    message: 'M'.repeat(50000),
  });
  assert.equal(res.status, 201);
  const saved = await ContactMessage.findOne({ email: 'flood@test.local' });
  assert.ok(saved.name.length <= 120, `name stored at ${saved.name.length} chars`);
  assert.ok(saved.message.length <= 5000, `message stored at ${saved.message.length} chars`);
  await ContactMessage.deleteOne({ _id: saved._id });
});

test('a contact submission missing required fields is refused', async () => {
  const anon = client();
  const res = await anon('POST', '/api/contact', { name: 'No Email' });
  assert.equal(res.status, 400);
});

// ------------------------------------------------- bootstrap marker -------

test('many ordinary admins can coexist (regression: unique sparse index on a null default)', async () => {
  // `bootstrap` must be ABSENT on ordinary admins. A sparse index does not skip
  // an explicit null, so a `default: null` made the unique index reject the
  // second admin - hidden only because the index was declared twice and never
  // applied as unique.
  const made = [];
  for (const n of [1, 2, 3, 4]) {
    const a = await Admin.create({
      name: `Bulk ${n}`, email: `bulk${n}@test.local`, password: 'BulkPass!2345',
      role: 'admin', permissions: [], isEmailVerified: true, isApproved: true,
    });
    made.push(a._id);
    assert.equal(a.bootstrap, undefined, 'bootstrap should be absent on an ordinary admin');
  }
  const raw = await Admin.collection.findOne({ email: 'bulk1@test.local' });
  assert.ok(!('bootstrap' in raw), 'bootstrap was written to the document, so sparse cannot skip it');
  for (const id of made) await Admin.deleteOne({ _id: id });
});

test('only one admin can hold the bootstrap marker', async () => {
  const first = await Admin.create({
    name: 'Boot One', email: 'boot1@test.local', password: 'BootPass!2345', bootstrap: true,
  });
  await assert.rejects(
    () => Admin.create({
      name: 'Boot Two', email: 'boot2@test.local', password: 'BootPass!2345', bootstrap: true,
    }),
    (err) => err.code === 11000,
    'a second bootstrap claim was accepted - the unique index is not in force'
  );
  await Admin.deleteOne({ _id: first._id });
});

test('an unknown route returns a 404 payload, not HTML', async () => {
  const c = client();
  const res = await c('GET', '/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.data.success, false);
});

// ------------------------------------------- password change (OTP only) ------

// The current password is deliberately not part of this flow: holding the
// registered mailbox is the factor. These tests pin that down, and pin down the
// brute-force bound that has to come with it, since the code is the only thing
// standing between a live session and a new password.

const OTP_USER = { email: 'otp@test.local', password: 'OtpUser!2345' };

/** Plants a known code, bypassing the mail send and its rate limit. */
const plantOtp = async (email, code, expiresInMs = 10 * 60 * 1000) => {
  await Admin.updateOne(
    { email },
    { $set: { passwordOTP: code, passwordOTPExpires: new Date(Date.now() + expiresInMs), passwordOTPAttempts: 0 } }
  );
};

const otpStateOf = async (email) => {
  const a = await Admin.findOne({ email }).select('+passwordOTP +passwordOTPExpires +passwordOTPAttempts');
  return { otp: a.passwordOTP, attempts: a.passwordOTPAttempts, expires: a.passwordOTPExpires };
};

test('a password change needs only the emailed code, not the current password', async () => {
  await Admin.create({
    name: 'OtpUser', email: OTP_USER.email, password: OTP_USER.password,
    role: 'admin', permissions: [], isEmailVerified: true, isApproved: true,
  });
  const c = await loginAs(OTP_USER);
  await plantOtp(OTP_USER.email, '123456');

  const res = await c('POST', '/api/auth/change-password', {
    newPassword: 'BrandNewPass!99',
    otp: '123456',
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));

  // The new password works and the old one does not.
  const fresh = client();
  const good = await fresh('POST', '/api/auth/login', { email: OTP_USER.email, password: 'BrandNewPass!99' });
  assert.equal(good.status, 200, 'new password should authenticate');
  const stale = client();
  const bad = await stale('POST', '/api/auth/login', { email: OTP_USER.email, password: OTP_USER.password });
  assert.equal(bad.status, 401, 'old password must stop working');

  // The code is consumed, so it cannot be replayed.
  const after = await otpStateOf(OTP_USER.email);
  assert.equal(after.otp, null, 'the used code must be cleared');
  assert.equal(after.attempts, 0);
});

test('a password change is refused when no code was requested', async () => {
  const c = await loginAs(NOPERMS);
  await Admin.updateOne({ email: NOPERMS.email }, { $set: { passwordOTP: null, passwordOTPExpires: null } });
  const res = await c('POST', '/api/auth/change-password', { newPassword: 'Whatever!2345', otp: '000000' });
  assert.equal(res.status, 400);
  assert.match(res.data.message, /no verification code/i);
});

test('a wrong code is refused and counts against the allowance', async () => {
  const c = await loginAs(LIMITED);
  await plantOtp(LIMITED.email, '222222');

  const res = await c('POST', '/api/auth/change-password', { newPassword: 'NopeNope!2345', otp: '999999' });
  assert.equal(res.status, 400);
  assert.match(res.data.message, /invalid verification code/i);
  assert.match(res.data.message, /4 attempts remaining/i);

  const st = await otpStateOf(LIMITED.email);
  assert.equal(st.attempts, 1, 'the attempt must be recorded');
  assert.equal(st.otp, '222222', 'a wrong guess must not discard a still-valid code');

  // And the password is untouched.
  const fresh = client();
  const still = await fresh('POST', '/api/auth/login', { email: LIMITED.email, password: LIMITED.password });
  assert.equal(still.status, 200, 'password must be unchanged after a failed attempt');
});

test('a code is discarded after five wrong guesses', async () => {
  const c = await loginAs(LIMITED);
  await plantOtp(LIMITED.email, '333333');

  let last;
  for (let i = 0; i < 5; i += 1) {
    last = await c('POST', '/api/auth/change-password', { newPassword: 'StillNope!2345', otp: '111111' });
    assert.equal(last.status, 400);
  }
  assert.match(last.data.message, /no longer valid/i);

  const st = await otpStateOf(LIMITED.email);
  assert.equal(st.otp, null, 'the code must be discarded, not left guessable');

  // The correct code no longer works either - it is genuinely gone.
  const after = await c('POST', '/api/auth/change-password', { newPassword: 'StillNope!2345', otp: '333333' });
  assert.equal(after.status, 400);
  assert.match(after.data.message, /no verification code/i);
});

test('an expired code is refused without burning an attempt', async () => {
  const c = await loginAs(LIMITED);
  await plantOtp(LIMITED.email, '444444', -1000); // already expired

  const res = await c('POST', '/api/auth/change-password', { newPassword: 'Expired!23456', otp: '444444' });
  assert.equal(res.status, 400);
  assert.match(res.data.message, /expired/i);

  const st = await otpStateOf(LIMITED.email);
  assert.equal(st.otp, null, 'an expired code should be cleared');
  assert.equal(st.attempts, 0, 'expiry must not consume the attempt allowance');
});

test('a short new password is refused before the code is checked', async () => {
  const c = await loginAs(LIMITED);
  await plantOtp(LIMITED.email, '555555');
  const res = await c('POST', '/api/auth/change-password', { newPassword: 'short', otp: '555555' });
  assert.equal(res.status, 422);
  const st = await otpStateOf(LIMITED.email);
  assert.equal(st.otp, '555555', 'a rejected password must leave the code usable');
});

test('requesting a code issues one and resets the allowance', async () => {
  const c = await loginAs(LIMITED);
  await Admin.updateOne({ email: LIMITED.email }, { $set: { passwordOTPAttempts: 4 } });

  const res = await c('POST', '/api/auth/change-password/send-otp');
  assert.equal(res.status, 200, JSON.stringify(res.data));

  const st = await otpStateOf(LIMITED.email);
  assert.match(String(st.otp), /^\d{6}$/, 'a six-digit code should be stored');
  assert.equal(st.attempts, 0, 'a fresh code must start with a full allowance');
  assert.ok(st.expires > new Date(), 'the code should be in date');
});

// ------------------------------------------------- password reset by link ----

// Two things are pinned here. First, the reset token lives in its own field:
// it used to share verificationToken with email verification, which meant a
// verification link could set an account's password - so forwarding an invite
// was an account takeover. Second, only the digest is stored, so reading the
// database does not yield usable reset links.

import crypto from 'node:crypto';

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

const plantResetToken = async (email, rawToken, expiresInMs = 60 * 60 * 1000) => {
  await Admin.updateOne(
    { email },
    { $set: { resetTokenHash: sha256(rawToken), resetTokenExpires: new Date(Date.now() + expiresInMs) } }
  );
};

test('forgot-password stores only a digest, and not in the verification field', async () => {
  const c = client();
  const res = await c('POST', '/api/auth/forgot-password', { email: NOPERMS.email });
  assert.equal(res.status, 200);

  const a = await Admin.findOne({ email: NOPERMS.email }).select('+resetTokenHash +resetTokenExpires');
  assert.match(String(a.resetTokenHash), /^[0-9a-f]{64}$/, 'a sha-256 digest should be stored');
  assert.ok(a.resetTokenExpires > new Date(), 'the token should be in date');
  // The whole point of the split: verification is untouched by a reset request.
  assert.equal(a.verificationToken, null, 'a reset must not populate verificationToken');
});

test('a reset token sets a new password and is single-use', async () => {
  const raw = 'reset-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  await plantResetToken(NOPERMS.email, raw);

  const c = client();
  const res = await c('POST', `/api/auth/reset-password/${raw}`, { password: 'ResetPass!2345' });
  assert.equal(res.status, 200, JSON.stringify(res.data));

  const fresh = client();
  const good = await fresh('POST', '/api/auth/login', { email: NOPERMS.email, password: 'ResetPass!2345' });
  assert.equal(good.status, 200, 'the new password should authenticate');

  // Replay must fail: the token is cleared on use.
  const again = await c('POST', `/api/auth/reset-password/${raw}`, { password: 'Another!23456' });
  assert.equal(again.status, 400, 'a reset token must not be reusable');
});

test('an email-verification token cannot be used to reset a password', async () => {
  // This is the takeover path that the shared field allowed.
  const verifyToken = 'verification-token-bbbbbbbbbbbbbbbbbbbb';
  await Admin.updateOne(
    { email: NOPERMS.email },
    {
      $set: { verificationToken: verifyToken, verificationTokenExpires: new Date(Date.now() + 3600e3) },
      $unset: { resetTokenHash: '', resetTokenExpires: '' },
    }
  );

  const c = client();
  const res = await c('POST', `/api/auth/reset-password/${verifyToken}`, { password: 'Hijacked!2345' });
  assert.equal(res.status, 400, 'a verification token must not reset a password');

  // And the password really did not change.
  const fresh = client();
  const still = await fresh('POST', '/api/auth/login', { email: NOPERMS.email, password: 'ResetPass!2345' });
  assert.equal(still.status, 200, 'the password must be unchanged');
});

test('an expired reset token is refused and cleared', async () => {
  const raw = 'expired-token-cccccccccccccccccccccccccc';
  await plantResetToken(NOPERMS.email, raw, -1000);

  const c = client();
  const res = await c('POST', `/api/auth/reset-password/${raw}`, { password: 'TooLate!23456' });
  assert.equal(res.status, 400);
  assert.match(res.data.message, /expired/i);

  const a = await Admin.findOne({ email: NOPERMS.email }).select('+resetTokenHash');
  assert.equal(a.resetTokenHash, null, 'an expired token should be cleared');
});

test('the emailed reset link is one origin, not the whole CORS allowlist', async () => {
  // Regression: the link was built by interpolating CLIENT_URL, which is a
  // comma-separated allowlist, producing
  // "http://localhost:5173,http://localhost:5174,...:5174/admin/reset-password".
  const { clientUrl } = await import('../config/site.js?reset-link-test');
  const before = process.env.CLIENT_URL;
  process.env.CLIENT_URL = 'https://www.example.com,https://example.com,http://localhost:5173';
  try {
    const link = clientUrl('/admin/reset-password?token=abc');
    assert.equal(link, 'https://www.example.com/admin/reset-password?token=abc');
    assert.ok(!link.includes(','), 'a link must never contain a comma');
    assert.equal(new URL(link).origin, 'https://www.example.com');
  } finally {
    process.env.CLIENT_URL = before;
  }
});

// ------------------------------------- password change ends other sessions ---

// A JWT carries no server-side state, so before passwordChangedAt existed a
// session on another device kept working for up to the refresh token's seven
// days after the password changed. These pin that it no longer does.

const TWO_DEVICE = { email: 'twodevice@test.local', password: 'TwoDevice!2345' };

test('changing the password ends a session on another device', async () => {
  await Admin.create({
    name: 'TwoDevice', email: TWO_DEVICE.email, password: TWO_DEVICE.password,
    role: 'admin', permissions: [], isEmailVerified: true, isApproved: true,
  });

  // Two independent cookie jars: the same account signed in twice.
  const deviceA = await loginAs(TWO_DEVICE);
  const deviceB = await loginAs(TWO_DEVICE);

  // Both are live to begin with.
  assert.equal((await deviceA('GET', '/api/auth/me')).status, 200, 'A should start authenticated');
  assert.equal((await deviceB('GET', '/api/auth/me')).status, 200, 'B should start authenticated');

  // passwordChangedAt is backdated one second on purpose, so that a token
  // minted immediately after a reset is not caught by its own stamp. A real
  // second session is always older than that window; this waits past it rather
  // than pretending a device signed in the same millisecond.
  await new Promise((r) => setTimeout(r, 1100));

  // B changes the password.
  await plantOtp(TWO_DEVICE.email, '654321');
  const changed = await deviceB('POST', '/api/auth/change-password', {
    newPassword: 'RotatedPass!99',
    otp: '654321',
  });
  assert.equal(changed.status, 200, JSON.stringify(changed.data));

  // A still holds a valid, unexpired access token - and must now be refused.
  const meA = await deviceA('GET', '/api/auth/me');
  assert.equal(meA.status, 401, 'the other device must be signed out');
  assert.match(meA.data.message, /password was changed/i);

  // And it cannot mint a fresh access token from its week-long refresh token.
  const refreshA = await deviceA('POST', '/api/auth/refresh');
  assert.equal(refreshA.status, 401, 'a stale refresh token must not be honoured');
  assert.match(refreshA.data.message, /password was changed/i);
});

test('a password reset by link also ends other sessions', async () => {
  const device = await loginAs({ email: TWO_DEVICE.email, password: 'RotatedPass!99' });
  assert.equal((await device('GET', '/api/auth/me')).status, 200);
  await new Promise((r) => setTimeout(r, 1100)); // clear the backdating window

  const raw = 'reset-ends-sessions-dddddddddddddddddddd';
  await plantResetToken(TWO_DEVICE.email, raw);
  const c = client();
  const res = await c('POST', `/api/auth/reset-password/${raw}`, { password: 'AfterReset!2345' });
  assert.equal(res.status, 200, JSON.stringify(res.data));

  assert.equal((await device('GET', '/api/auth/me')).status, 401, 'the live session must be ended by a reset');
});

test('the password hash is never selected or serialised', async () => {
  // select: false, so an ordinary read does not even load it.
  const plain = await Admin.findOne({ email: TWO_DEVICE.email });
  assert.equal(plain.password, undefined, 'an ordinary query must not load the hash');

  // And it is absent from the API representation.
  const c = await loginAs({ email: TWO_DEVICE.email, password: 'AfterReset!2345' });
  const me = await c('GET', '/api/auth/me');
  assert.equal(me.status, 200);
  const body = JSON.stringify(me.data);
  // Check for the field and for a bcrypt digest, rather than the bare substring
  // "password" - harmless names like passwordChangedAt would match that.
  assert.ok(!/"password"\s*:/.test(body), 'no password field should appear in /me');
  assert.ok(!/\$2[aby]\$/.test(body), 'no bcrypt hash should appear in /me');
  assert.ok(!/passwordChangedAt/.test(body), 'internal bookkeeping should not be serialised');

  // Login still works, which is the one path that asks for the hash.
  assert.ok(me.data.data.admin.email === TWO_DEVICE.email);
});
