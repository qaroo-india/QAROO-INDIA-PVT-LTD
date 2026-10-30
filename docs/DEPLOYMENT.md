# Deploying Qaroo India

Everything in the repository is deploy-ready. What remains needs accounts and
DNS, which is why it is written as steps rather than done for you.

Run the check before and after each attempt:

```bash
cd backend
NODE_ENV=production node tools/preflight.mjs
```

It exits non-zero while anything is still blocking, and it never prints a secret.

---

## 1. Decide the domain first

Everything else depends on this, so settle it before touching a host.

| Domain | DNS | Notes |
| --- | --- | --- |
| `qaroo.in`, `www.qaroo.in` | resolves to `68.178.153.15` (GoDaddy) | also hosts the `support@qaroo.in` mailbox |
| `qarootech.in` | **no A record, no NS records** | cannot serve a site in this state |

The project now uses **`https://www.qaroo.in`**, because it is the domain that
resolves and the one the mail is on. Your social handles are `qarootech`, so if
the intended public domain is really `qarootech.in`, you must first point its
DNS at a host — then change it in exactly three places:

1. `frontend/src/data/site.js` — `SITE_URL` (frontend canonicals, og:url, sitemap)
2. `backend/config/site.js` — `SITE_URL` (canonicals written onto records)
3. `frontend/index.html` and `frontend/public/robots.txt` — static literals

then re-run:

```bash
cd frontend && node tools/build-sitemap.mjs          # regenerate the 34 URLs
cd ../backend && node tools/retarget-domain.mjs --apply   # rewrite stored canonicalUrl
cd ../frontend && npm run build
```

`retarget-domain.mjs` is idempotent and reversible — swap `--from`/`--to` to go
back.

---

## 2. Hosting shape

**Chosen: Shape E — both on Vercel.** Jump to that section. The others are kept
for reference, and their config files are inert when unused: `frontend/public/.htaccess`
does nothing on Vercel, and `deploy/` only matters on EC2.

### Shape A — split hosting

Static site on GoDaddy cPanel, API on a Node host, both under `qaroo.in`.

- Uses `frontend/public/.htaccess` (already correct). `vercel.json` is ignored.
- `api.qaroo.in` and `www.qaroo.in` share a registrable domain, so they are
  **same-site**: cookies work with the default `SameSite=Lax` and you do
  **not** set `COOKIE_SAMESITE`.
- GoDaddy shared hosting runs PHP/Apache well and Node poorly, which is why the
  API goes elsewhere.

### Shape B — single origin

One Node host serves both the API and `frontend/dist`. Set `SERVE_STATIC=true` and point
`qaroo.in` at it. No CORS and no cookie subtleties at all — the simplest and
tightest option if you are willing to move off GoDaddy hosting for the website
(the mailbox can stay).

### Shape C — Vercel frontend

Uses `vercel.json`; delete `frontend/public/.htaccess` so it cannot confuse anyone. If
the frontend lands on `*.vercel.app` rather than a `qaroo.in` subdomain it is
**cross-site**, and you must set `COOKIE_SAMESITE=none` or admin login will
appear to succeed and immediately log out. Attaching `www.qaroo.in` to Vercel
avoids this entirely.

### Shape D — AWS Amplify frontend + EC2 backend

Artifacts for this are committed and inert until you use them:

| File | Purpose |
| --- | --- |
| `frontend/amplify.yml` | Amplify build spec. Set the app root to **`frontend`**. It fails the build if `VITE_API_BASE_URL` is unset or missing the `/api` suffix. |
| `deploy/amplify-rewrites.json` | The SPA fallback. `frontend/public/.htaccess` is an Apache file and does **nothing** on Amplify, so without this rule a refresh on `/learning-programs/<slug>` returns Amplify's 404. |
| `deploy/nginx-api.qaroo.in.conf` | Reverse proxy to `127.0.0.1:5000`, with certbot notes. |
| `deploy/ecosystem.config.cjs` | PM2 definition, bound to loopback. |

Specific to this shape:

- **Set `HOST=127.0.0.1`.** The app binds all interfaces by default, which is required on managed hosts but wrong on a machine you own — it leaves port 5000 publicly reachable if the security group is ever loose. Keep 5000 closed in the security group too; the bind address and the firewall are independent controls.
- **Do not set `X-Forwarded-For` with `$proxy_add_x_forwarded_for`.** The app sets `trust proxy 1`, so it reads the *last* entry as the client. Appending preserves a client-supplied header and lets a caller spoof its address straight past the rate limiters. The committed config uses `$remote_addr`.
- **Stay on one PM2 instance** unless you move the rate-limit store to Redis or Mongo first. `express-rate-limit`'s default store is per-process, so N workers each allow the full quota and every limit becomes N times looser.
- **Atlas:** give the instance an Elastic IP and allowlist that `/32`. This is better than the `0.0.0.0/0` that Render/Railway force, and your checklist is right to prefer it.

### Shape E — both on Vercel (chosen)

**Two Vercel projects from the same repository.** The dependencies live in
`backend/package.json`, not the root, so one project cannot build both.

| Project | Root Directory | Serves |
| --- | --- | --- |
| `qaroo-web` | `frontend` | the SPA from `frontend/dist`, via `frontend/vercel.json` |
| `qaroo-api` | `backend` | `backend/api/[...path].js` as a serverless function |

Both Root Directories are set, and **neither project needs Vercel's "Include
source files outside of the Root Directory" option** — each side is
self-contained. That was not true before: the API imported the MOU and CSR
category lists from the frontend's `src/data/`, so a backend-only upload would
not have resolved them. The backend now owns its copy in
`backend/data/categories.js`, and a test asserts the two stay identical.

Set `qaroo-api`'s domain to **`api.qaroo.in`** and `qaroo-web`'s to
`www.qaroo.in` + `qaroo.in`. Same registrable domain means **same-site**, so
cookies work on the default `SameSite=Lax` and you do *not* set
`COOKIE_SAMESITE`. If you instead leave the API on `*.vercel.app` while the site
is on `qaroo.in`, that is cross-site and you **must** set `COOKIE_SAMESITE=none`
or admin login will appear to work and immediately sign out.

Environment variables:

```
# qaroo-api project
NODE_ENV=production
MONGODB_URI=...            # Atlas; allowlist 0.0.0.0/0, serverless has no fixed egress
JWT_SECRET=...
CLIENT_URL=https://www.qaroo.in,https://qaroo.in
RATE_LIMIT_STORE=mongo     # not strictly needed - VERCEL=1 implies it - but explicit
CLOUDINARY_CLOUD_NAME=...  # MANDATORY here, see below
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=... EMAIL_PORT=... EMAIL_SECURE=... EMAIL_USER=... EMAIL_PASSWORD=... EMAIL_FROM=...
ADMIN_EMAIL=support@qaroo.in
# Do NOT set SERVE_STATIC or HOST - neither applies.

# qaroo-web project
VITE_API_BASE_URL=https://api.qaroo.in/api
```

Four things serverless changes, all handled in code but worth knowing:

1. **Rate limits need shared state.** `express-rate-limit`'s default store
   counts per process, so every cold start began with an empty tally and the
   login, forgot-password and OTP-send limits were effectively unenforced.
   `middleware/mongoRateLimitStore.js` counts in MongoDB instead, with a TTL
   index for cleanup. It selects itself automatically when `VERCEL` is set.
   *(The per-code OTP attempt counter was already on the admin document, so
   that one survived regardless.)*
2. **Resumes go to MongoDB when Cloudinary is unset.** There is no writable
   persistent disk, so the old local-disk fallback could not work at all. The
   file is now stored in its own `resumefiles` collection instead (`RESUME_STORE=mongo`,
   implied by `VERCEL`), which survives a redeploy. Binary blobs in a database
   are not the general answer, but at a 3MB cap, a handful of uploads and reads
   only when an admin opens one, it is the right trade — and far better than
   losing applications. **Cloudinary is still preferred** and is tried first;
   an Atlas M0 (512MB) holds roughly 170 resumes, so configure it before
   volume picks up. Switching later needs no code change.
3. **Vercel caps a function request body at 4.5 MB.** Resumes arrive
   base64-encoded, which inflates a file by 4/3, so the limit drops to **3 MB**
   automatically when `VERCEL` is set. A 5 MB file would be refused at the edge
   with an opaque 413 before any of this code ran.
4. **The connection is cached per instance** (`connectLazy`) with
   `maxPoolSize: 5`. Connecting per request, or keeping the default pool, would
   exhaust the Atlas connection limit once the platform runs several instances.

Also: `api/[...path].js` is a **catch-all filename on purpose**. A plain
`api/index.js` plus a `vercel.json` rewrite does not work here, because a
rewrite replaces the path the function receives — Express would see `/api` for
every request and nothing would route.

`maxDuration: 30` in `backend/vercel.json` needs a paid plan; lower it to 10 on
Hobby.

### Which to pick

Shape E is what the repository is configured for, and `frontend/dist` is built against it. Shape D is a bigger setup — you own patching, nginx, TLS renewal and PM2 — but gives you a pinnable egress IP for Atlas and somewhere to run cron. Shape B is the simplest and tightest of all if you are willing to move the website off GoDaddy hosting (the mailbox can stay).

**Sections 3 and 4 below are written for Shape A**, since they cover the
backend and frontend steps generically. Where Shape E differs — environment
variables, Cloudinary being mandatory, the smaller upload cap — the Shape E
section above is authoritative.

---

## 3. Backend

### 3.1 Environment

`backend/.env.production` has been generated for you and is gitignored. It
contains a fresh 96-character `JWT_SECRET`, the correct `CLIENT_URL`, and your
existing database and mail settings.

Paste those values into your host's environment settings. Do **not** upload the
file — a host's env store is not in a web root and is not in a backup.

Still blank, and only you can fill them:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Without Cloudinary, uploaded resumes and CMS images are written to the
container's local disk and **lost on every redeploy**. Job applications are the
one thing on this site you cannot regenerate, so set it before you take real
applications.

### 3.2 Atlas network access

**Atlas → Security → Network Access → IP Access List.**

What to allowlist depends entirely on where the backend runs:

| Host | Entry | Why |
| --- | --- | --- |
| **EC2** (Shape D) | the instance's **Elastic IP**, as `/32` | A plain EC2 public IP changes on stop/start; an Elastic IP does not. This is the only option here that is both pinned and stable. |
| **Render / Railway** (Shape A) | `0.0.0.0/0` | Egress is from a shared pool with no fixed address. Unavoidable on these hosts — which is why the database password has to be strong and rotated if ever disclosed. Paid tiers sometimes offer static egress; use it if available. |
| **Amplify compute** | `0.0.0.0/0` | Same reason. |

So `0.0.0.0/0` is not automatically wrong — it is forced by hosts without stable
egress. But it does mean the password is the *only* thing protecting the
database, so prefer a host with a pinnable IP where you can.

**Your own machine** needs an entry too, for the local tools. It rotates on this
connection — `223.185.23.8` → `.40` → `223.185.20.72` over the course of this
work — so re-add it whenever local tooling stops connecting.

Atlas reports a blocked IP as a **TLS alert 80 / `tlsv1 alert internal error`**,
*not* as an authentication failure. If you see that, it is the allowlist, not
the password. `tools/preflight.mjs` and `rotate-credential.mjs` both detect this
case and say so explicitly, because the raw error points the wrong way.

### 3.3 Deploy

Root directory `backend`, build `npm ci`, start `npm start` (not `npm run dev` —
`nodemon` is a dev dependency and carries the only outstanding advisories).

Then add a CNAME `api` → your host, and confirm:

```bash
curl -sS https://api.qaroo.in/api/health
```

### 3.4 Seed, once

```bash
cd backend && NODE_ENV=production npm run seed
```

Safe to run on an empty database. **It is not safe to re-run casually once
admins have edited content** — the seeders differ:

| Seeder | Re-run behaviour |
| --- | --- |
| `seedAdmin` | creates the admin only if absent — safe |
| `seedCSR` | skipped entirely if any project exists — safe |
| `seedMous` | skipped if any MOU exists, only fills missing logos — safe |
| `seedContent` | merges missing keys, leaves existing values — safe |
| `seedCareers` | overwrites every field **except** `status` |
| `seedLearning` | **overwrites the whole record**, discarding admin edits |
| `seedBusiness` | **overwrites the whole record**, discarding admin edits |

So after launch, treat `npm run seed` as a content reset for learning programmes
and business solutions, not a top-up. Edit those through the admin panel, or
change `backend/data/seedData.js` and re-seed deliberately.

**Do not run `seed/clearMOUImages.js`** (destructive, one-off repair) or
`seed/cleanupLegacyLearning.js` (`deleteMany`). Neither is called by
`npm run seed`.

---

## 4. Frontend

Already configured and built. `frontend/.env.production` (gitignored) holds:

```
VITE_API_BASE_URL=https://api.qaroo.in/api
```

`API_BASE` is used as `` `${BASE}/auth/refresh` ``, so it must **include
`/api`**. This is the single easiest thing to get wrong:

```bash
# correct
VITE_API_BASE_URL=https://api.qaroo.in/api
# wrong - every request 404s
VITE_API_BASE_URL=https://api.qaroo.in
```

To rebuild later, `npm run build` from `frontend/` picks that file up automatically.

Upload the **contents** of `frontend/dist/` to `public_html/`, including the dotfile
`.htaccess` — SPA deep links such as `/learning-programs/full-stack-development`
return 404 without it. Many FTP clients hide dotfiles by default.

Enable HTTPS and force a redirect in cPanel. The admin cookies are `Secure` in
production, so they are never sent over plain HTTP and the admin panel cannot
log in on an `http://` origin.

---

## 5. After the first deploy

```bash
curl -sI https://www.qaroo.in | head -20                  # 200, HTTPS
curl -sI https://www.qaroo.in/learning-programs | head -5 # 200, not 404 (SPA fallback)
curl -sS https://api.qaroo.in/api/health                  # API reachable
curl -sS https://www.qaroo.in/robots.txt                  # points at the right sitemap
```

Then, in a browser: log in to `/admin`, reload the page (proves the refresh
cookie survives), submit a contact form and a brochure request, and download a
resume from the applications table.

Submit the sitemap at `https://www.qaroo.in/sitemap.xml` to Google Search
Console.

### Mail deliverability — SPF and DKIM

`tools/check-mail.mjs` proving AUTH works only means the server accepted the
credential. It says nothing about whether the message reaches an inbox. Without
these records, password-reset and verification mail is routinely filed as spam.

Add at GoDaddy DNS for `qaroo.in`:

| Type | Name | Value |
| --- | --- | --- |
| TXT | `@` | `v=spf1 include:secureserver.net -all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:support@qaroo.in; fo=1` |

- **SPF:** if a TXT record starting `v=spf1` already exists, **edit it** rather
  than adding a second one — two SPF records is itself a failure. Use `-all`
  only once you are sure nothing else sends as `qaroo.in`; `~all` is the safer
  first move.
- **DKIM:** GoDaddy generates the key, so it cannot be written out here. Enable
  it in Email & Office → your domain → DKIM, then add the `CNAME`/`TXT` records
  it gives you.
- **DMARC:** start at `p=none`, which only reports. Move to `p=quarantine` after
  a week or two of clean reports, never on day one.

Verify once propagated:

```bash
nslookup -type=TXT qaroo.in 8.8.8.8
nslookup -type=TXT _dmarc.qaroo.in 8.8.8.8
```

Then send yourself a real message and check the headers show `spf=pass` and
`dkim=pass`:

```bash
cd backend && node tools/check-mail.mjs --send=you@example.com
```

---

## 6. Admin accounts

Two super admins exist, both verified and approved:

| Login | Mailbox |
| --- | --- |
| `support@qaroo.in` | the authenticated sender — reset codes deliver |
| `anunithamr@gmail.com` | external, delivers independently |

The first was `admin@qaroo.in` until a password-reset code to it bounced with
`550 Recipient not found` — that mailbox was never created. It has been renamed
to `support@qaroo.in` (same password), and `ADMIN_EMAIL` updated to match so
re-seeding cannot recreate the dead address.

If you later want a distinct `admin@` identity, create the mailbox or a
forwarder in GoDaddy *first*, then change `ADMIN_EMAIL`. `tools/preflight.mjs`
warns whenever `ADMIN_EMAIL` is a different mailbox from the authenticated
sender on the same domain, which is the condition that caused the bounce.

---

## 7. Session behaviour worth knowing

Changing or resetting a password now **ends every other session** for that
account. `Admin.passwordChangedAt` is stamped on the change, and `protect`,
`optionalAuth` and `/auth/refresh` all refuse a token minted before it — so a
signed-in browser elsewhere is logged out on its next request rather than
lasting until its seven-day refresh token expires.

Two consequences:

- A password change signs **you** out too, on every device. That is intended.
- The stamp is backdated one second, so a token issued in the same second as
  the change survives. Without that, logging straight back in after a reset
  could be rejected by its own stamp — `iat` has only second resolution.

A password change is authorised by the **emailed code alone**; the current
password is not required. Each code survives five wrong guesses and is then
discarded, so a lost code is a resend rather than a lockout.

---

## 8. Rotate these

Both were typed into a chat transcript during development and should be
considered disclosed: the **Atlas database user's password** and the
**`support@qaroo.in` mailbox password**.

`JWT_SECRET` in `.env.production` is freshly generated and was never printed.

### How to rotate without breaking anything

Change it at the provider **first**, then run the helper, which updates the env
files and immediately proves the new credential against the real service:

```bash
cd backend
node tools/rotate-credential.mjs mongo     # Atlas database user
node tools/rotate-credential.mjs email     # support@qaroo.in mailbox
```

It reads the new value from a hidden prompt — never an argument — so the
password does not reach your shell history or the process list. It backs the
file up, and **rolls back if verification fails**, so a mistyped paste cannot
leave the backend unable to start.

The reason not to hand-edit `.env` for the database one: the password lives
inside the connection string's userinfo section, so `: / ? # [ ] @ %` all have
to be percent-encoded. The current password begins with `@` and is stored as
`%40…`. Paste a new one in raw and the URI silently becomes wrong — and Atlas
reports it as an *authentication* failure, which sends you looking at the
password instead of the encoding.

### Order of operations

1. **Atlas:** create the *new* password on the existing user (Database Access →
   Edit → Edit Password). The old one stops working the moment you save, so do
   this when a few minutes of downtime is acceptable.
2. Run `rotate-credential.mjs mongo` locally and confirm it connects.
3. Update `MONGODB_URI` in the **host's** environment settings and redeploy or
   restart — the running process still holds the old string in memory.
4. Repeat for the mailbox via GoDaddy webmail, then
   `rotate-credential.mjs email`.
5. `NODE_ENV=production node tools/preflight.mjs` to confirm both.

Rotating `JWT_SECRET` as well signs out every admin immediately — fine to do,
just expect it.

---

## 9. Known, accepted

- **New admins are emailed a plaintext password.** `initialPassword` holds it
  between creation and verification, then it is cleared. It is `select: false`
  and stripped from JSON, so it is not exposed over the API, but a set-password
  link is the correct design — the machinery now exists (`resetTokenHash`), so
  `verifyAdmin` could issue a link instead of revealing the typed password.
  **This is the one outstanding security item.** It is left alone because it
  changes how a Super Admin onboards someone — today they choose the password
  and can pass it on out of band — and that is a product decision, not a patch.
- **3 dev-only advisories** (`nodemon`, `source-map-js`). Neither ships: the
  production dependency audit is clean on both sides.
- **Resumes are in MongoDB, not object storage**, until Cloudinary is
  configured. Durable and redeploy-safe, but it consumes cluster storage: an
  Atlas M0 holds roughly 170 at the 3MB cap. `preflight` reports this as
  advisory, not blocking.
- **Equal-height solution cards are not pixel-verified.** The page's WebGL
  carousel does not survive test stubbing; check them by eye.
