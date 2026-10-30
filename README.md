# Qaroo India — CMS-Driven Web App

Qaroo India is a full-stack CMS-driven web application built on the existing React/Vite public site plus a new Node.js/Express + MongoDB backend. The public frontend is now powered by an admin dashboard at `/admin` with role-based permissions, JWT auth (HTTP-only cookies), email verification, and a Super Admin approval workflow.

## Tech Stack

- **Frontend:** React 18, Vite 5, React Router v6, React Bootstrap, GSAP, Lenis, Motion, OGL (existing components/design preserved)
- **Backend:** Node.js, Express, MongoDB + Mongoose
- **Auth:** JWT access/refresh tokens in HTTP-only cookies, bcrypt password hashing, Nodemailer email verification
- **Images:** Cloudinary (falls back to raw URL passthrough when no credentials are configured)
- **Admin dashboard:** `/admin/*` — custom design system matching the Qaroo brand (`--admin-base: #931913`, `--admin-accent: #e4cc2e`)

## Folder Structure

A monorepo with two independently deployable halves. Neither imports source
from the other at runtime, so each can be built from its own directory — which
is what lets them deploy as separate Vercel projects.

```
qaroo-react-app/
├── frontend/                 # React 18 + Vite (public site + admin panel)
│   ├── src/
│   │   ├── admin/            # Admin dashboard (routes, layout, pages, context, css)
│   │   ├── api/              # Centralized API client + per-module wrappers
│   │   ├── components/       # Shared components and animations
│   │   ├── data/             # Static content and the canonical SITE_URL
│   │   └── pages/            # Public pages (fetch from the backend)
│   ├── public/               # Served as the site root: brochures, logos, robots, sitemap
│   ├── tools/                # build-sitemap.mjs
│   ├── index.html            # SEO tags, JSON-LD
│   ├── vite.config.js        # Dev proxy: /api -> http://localhost:5000
│   ├── vercel.json           # SPA rewrite (Vercel: Root Directory = frontend)
│   └── amplify.yml           # Build spec if deploying to AWS Amplify instead
│
├── backend/                  # Express 5 + Mongoose
│   ├── app.js                # Builds the app; no side effects, no listen()
│   ├── server.js             # Long-running entry (local, Render, EC2)
│   ├── api/[...path].js      # Serverless entry (Vercel: Root Directory = backend)
│   ├── config/               # DB connection, env validation, SITE_URL
│   ├── controllers/          # auth, admin, mou, page, csr, learning, careers, contact
│   ├── middleware/           # auth, permissions, errors, rate limiters + Mongo store
│   ├── models/               # Admin, MOU, PageContent, CSRProject, LearningProgram,
│   │                         #   JobPosting, JobApplication, ResumeFile, ContactMessage
│   ├── routes/               # One router per module
│   ├── services/             # email, image (Cloudinary), resume storage
│   ├── data/                 # seedData.js, categories.js (canonical, mirrored in frontend)
│   ├── seed/                 # Idempotent seed scripts (npm run seed)
│   ├── tools/                # preflight, check-mail, rotate-credential, migrate-to-atlas
│   └── test/                 # integration.test.js (46 tests, isolated DB, no server needed)
│
├── deploy/                   # nginx, PM2 and Amplify rewrite configs for self-hosting
├── docs/                     # DEPLOYMENT.md, WORKFLOW.md, brochure sources
├── setup.sh                  # One-shot server bootstrap
└── AGENTS.md                 # Repository conventions
```

Run commands from the half you mean: `npm run dev` / `npm run build` /
`npm run lint` in `frontend/`, and `npm start` / `npm run seed` / `npm test` /
`npm run lint` in `backend/`.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally on `127.0.0.1:27017` (or set `MONGODB_URI`)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # then edit .env (JWT_SECRET, admin, email, etc.)
```

Configure `backend/.env`:

- `JWT_SECRET` — long random secret (required)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — required by the seed script; the Super Admin is never created with a default password, so set both before seeding
- `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` — SMTP for verification emails (leave blank to skip actual sending in dev)
- `CLOUDINARY_*` — optional; image upload falls back to URL passthrough when blank, resumes to local disk

### 2. Seed the database

```bash
cd backend
npm run seed
```

This creates the Super Admin (using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`, both required) and seeds all migrated content (14 MOUs, 12 CSR projects, 7 learning programs, and page content for home/about/business/contact).

### 3. Start the backend

```bash
cd backend
npm run dev        # nodemon, or: npm start
```

Server runs at `http://localhost:5000`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev proxy forwards `/api` requests to `http://localhost:5000`. Open `http://localhost:5173` for the public site and `http://localhost:5173/admin` for the admin dashboard.

## Admin Dashboard

- **`/admin/login`** — sign in (cookies set automatically via API)
- **`/admin/register`** — sign up as a non-Super Admin (requires email verification + Super Admin approval)
- **`/admin/dashboard`** — overview stats
- **`/admin/mous`** — MOU directory CRUD
- **`/admin/csr`** — CSR project CRUD
- **/admin/learning** — learning program CRUD
- **`/admin/content`** — edit page content (home / about / business / contact)
- **`/admin/messages`** — view/mark/resolve contact-message submissions
- **`/admin/admins`** — manage other admins, approve, and edit granular permissions (Super Admin only)

## Roles & Permissions

Super Admin bypasses all permission checks. Granular permissions are defined in `backend/utils/permissions.js`:

`dashboard.view`, `mou.create/read/update/delete`, `home.update`, `about.update`, `business.update`, `learning.create/read/update/delete`, `csr.create/read/update/delete`, `contact.read/delete`, `admin.create/read/update/delete`, `permissions.manage`

- Public reads use `optionalAuth` (only published data unless an admin token is attached).
- Mutations use `protect` + `requireVerifiedApproved` + `requirePermission(...)`.
- If no admins exist, the first registered admin automatically becomes a verified + approved Super Admin.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register` | Register admin |
| POST | `/api/auth/login` | Login (sets cookies) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify-email/:token` | Verify email via token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET/POST/PUT/DELETE | `/api/admins` | Admin management (Super Admin) |
| GET/POST/PUT/DELETE | `/api/mous` | MOU directory CRUD |
| GET | `/api/mous/categories` | MOU category dropdown list |
| GET/POST/PUT/DELETE | `/api/csr` | CSR project CRUD |
| GET | `/api/csr/categories` | CSR category dropdown list |
| GET/POST/PUT/DELETE | `/api/learning` | Learning program CRUD |
| GET/POST/PUT/DELETE | `/api/business-solutions` | Business solutions CRUD |
| GET/PUT | `/api/content/:page` | Page content (home/about/business/learning/csr/contact/mou) |
| GET | `/api/content/pages` | List valid page keys |
| GET | `/api/stats` | Live published counts (MOUs, CSR projects) |
| POST | `/api/contact` | Submit a contact message (public) |
| GET/PUT/DELETE | `/api/contact` | Admin message management |
| POST | `/api/client-errors` | Report a frontend crash (public) |
| GET | `/api/client-errors` | List frontend crashes (Super Admin) |
| GET/POST/PUT/DELETE | `/api/careers` | Job posting CRUD |
| GET | `/api/careers/by-slug/:slug` | Public job detail by slug |
| POST | `/api/applications` | Submit a job application (public, rate-limited) |
| GET/POST/DELETE | `/api/applications` | Admin application management |
| GET | `/api/applications/:id/resume` | Download a resume (permission-gated) |
| GET | `/api/auth/me` | Current admin profile |
| POST | `/api/auth/change-password` | Change password (email OTP) |
| POST | `/api/{mous,csr,learning,business-solutions,careers}/:id/publish` | Toggle published/draft |
| GET | `/api/{learning,business-solutions}/by-slug/:slug` | Public detail by slug |
| GET | `/api/health` | Health check |

## Verification

- **Frontend build:** `cd frontend && npm run build` (verifies the whole app including admin compiles)
- **Frontend lint:** `cd frontend && npm run lint`
- **Backend tests:** `cd backend && npm test` — 46 integration tests against an
  isolated database. Needs no running server, and refuses to run unless the
  database name contains `test`.
- **Backend lint:** `cd backend && npm run lint`
- **Pre-deployment check:** `cd backend && NODE_ENV=production node tools/preflight.mjs`
  — verifies database reachability, SMTP auth, CORS origins, cookie scope,
  `frontend/dist` freshness and the serverless constraints.
- **Live API smoke test:** `cd backend && node test/api.test.js` (runs against a
  server already listening on `localhost:5000`)
