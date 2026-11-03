# Qaroo India — Unified Full-Stack Web Application

Qaroo India is a full-stack CMS-driven web application built as a unified single project using React 18 / Vite on the frontend and Node.js / Express on the backend, with Google Firebase Cloud Firestore as the cloud database.

The public frontend is powered by an admin dashboard at `/admin` with role-based permissions, JWT authentication (HTTP-only cookies), email verification, and a Super Admin approval workflow.

---

## Tech Stack

- **Frontend:** React 18, Vite 6, React Router v7, React Bootstrap, GSAP, Motion, OGL (all existing styling, design, and animations preserved)
- **Backend:** Node.js, Express 5, Firebase Cloud Firestore (`crm-qaroo`)
- **Database:** Firebase Cloud Firestore (NoSQL, real-time, serverless-compatible)
- **Authentication:** JWT access/refresh tokens in HTTP-only cookies, bcrypt password hashing, Nodemailer email verification
- **Deployment:** Vercel (Unified single-project deployment with serverless API functions and Vite static hosting)

---

## Unified Project Architecture

The repository is structured as a unified, single project deployable directly to Vercel without maintaining separated repositories or independently managed deployments:

```
qaroo-react-app/
├── api/                      # Vercel Serverless Function entry point
│   └── index.js              # Express app serverless handler (/api/*)
├── public/                   # Public assets: brochures, logos, robots.txt, sitemap.xml
├── server/                   # Backend Express application logic
│   ├── app.js                # Express app setup and middleware routing
│   ├── config/               # Site configuration and environment validation
│   ├── controllers/          # Admin, auth, MOU, page, CSR, learning, careers, contact
│   ├── db/                   # Firebase initialization & FirestoreModel query layer
│   ├── middleware/           # Auth, permissions, errors, rate limiting
│   ├── models/               # Firestore models (Admin, MOU, JobPosting, etc.)
│   ├── routes/               # Modular Express API routes
│   ├── seed/                 # Content and Admin seed scripts
│   ├── services/             # Email, image (Cloudinary), and resume storage
│   ├── tools/                # Maintenance and preflight utilities
│   └── utils/                # Token generation, pagination, permissions, slug helpers
├── src/                      # Frontend React 18 source code
│   ├── admin/                # Admin dashboard (pages, layout, context, styles)
│   ├── api/                  # API client (calls same-origin /api endpoints)
│   ├── components/           # UI components, animations, three.js / OGL canvas
│   ├── config/               # Frontend Firebase / analytics config
│   ├── data/                 # Content data and metadata
│   ├── pages/                # Public pages (Home, About, Business Solutions, etc.)
│   └── utils/                # Frontend utilities and analytics
├── .env.example              # Unified environment variables template
├── firestore.rules           # Cloud Firestore security rules
├── index.html                # Single-page application root HTML
├── package.json              # Unified dependencies and scripts
├── server.js                 # Standalone Express server entry (local development)
├── vercel.json               # Vercel routing configuration
└── vite.config.js            # Vite build and development configuration
```

---

## Scripts

All scripts run from the project root:

- `npm run dev` — Starts the Vite frontend dev server with proxy to backend `/api`.
- `npm run build` — Compiles and bundles the production frontend to `dist/`.
- `npm run lint` — Runs ESLint across frontend and backend code.
- `npm run seed` — Idempotently seeds initial CMS collections (MOUs, CSR projects, learning programs, business solutions, and admin account) in Firestore.
- `npm start` — Starts the standalone Express server (port 5000).

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | Local server port | `5000` |
| `JWT_SECRET` | Secret key for signing JWT tokens | *Required* |
| `ADMIN_EMAIL` | Initial Super Admin email | `admin@qaroo.in` |
| `ADMIN_PASSWORD` | Initial Super Admin password | *Required for seed* |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `crm-qaroo` |
| `FIREBASE_API_KEY` | Firebase Web API Key | Configured |
| `CLIENT_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `EMAIL_*` | SMTP credentials for email verification | Optional |
| `CLOUDINARY_*` | Cloudinary credentials for media upload | Optional |

---

## Vercel Deployment

Deploying to Vercel is seamless with the single-project structure:

1. Import this repository into Vercel.
2. Select **Vite** as the Framework Preset (Root Directory: `.`).
3. Set your Production Environment Variables (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, etc.) in the Vercel Dashboard.
4. Deploy!

Vercel will:
- Build the static frontend into `dist/` using `vite build`.
- Mount `api/index.js` as the serverless function handling all `/api/*` requests.
- Route single-page app routes to `/index.html`.

---

## Admin Dashboard Routes

- **`/admin/login`** — Sign in (secure HTTP-only JWT cookies)
- **`/admin/register`** — Sign up (email verification + Super Admin approval)
- **`/admin/dashboard`** — Analytics and system overview
- **`/admin/mous`** — MOU directory management
- **`/admin/csr`** — CSR project management
- **`/admin/learning`** — Learning programs and courses
- **`/admin/content`** — Page content management (Home, About, Business, Contact)
- **`/admin/messages`** — Inbound contact requests and brochure inquiries
- **`/admin/admins`** — Role and permission delegation (Super Admin only)

---

## API Summary

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/api/auth/login` | Admin sign-in |
| POST | `/api/auth/register` | Admin registration |
| POST | `/api/auth/refresh` | Token refresh |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current profile |
| GET/POST/PUT/DELETE | `/api/admins` | Admin management |
| GET/POST/PUT/DELETE | `/api/mous` | MOU directory |
| GET/POST/PUT/DELETE | `/api/csr` | CSR projects |
| GET/POST/PUT/DELETE | `/api/learning` | Learning programs |
| GET/POST/PUT/DELETE | `/api/business-solutions` | Business solutions |
| GET/POST/PUT/DELETE | `/api/careers` | Job postings |
| POST | `/api/applications` | Job application submission |
| GET/DELETE | `/api/applications` | Manage applications |
| POST | `/api/contact` | Inbound contact submission |
| GET/PUT/DELETE | `/api/contact` | Manage contact messages |
| GET | `/api/health` | Service health status |
