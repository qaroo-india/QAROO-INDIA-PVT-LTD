# QAROO INDIA — A→Z PROJECT WORKFLOW

## 1. SYSTEM ARCHITECTURE (at a glance)

```
┌────────────────────────── FRONTEND (React + Vite, port 5173) ──────────────────────────┐
│                                                                                        │
│   PUBLIC SITE                 │   ADMIN CMS (/admin)                                    │
│   app.jsx                     │   AdminRoutes.jsx                                       │
│   ├ Home                      │   ├ Login/Register/Verify/Reset                        │
│   ├ About                     │   ├ Dashboard                                          │
│   ├ Business Solutions        │   ├ MOU / CSR / Learning management                    │
│   ├ Learning Programs         │   ├ Content Management                                 │
│   ├ CSR Projects              │   ├ Messages                                           │
│   ├ MOU Directory             │   ├ Admin Management                                   │
│   ├ Contact                   │   └ Change Password                                    │
│   ├ Terms / Privacy / Sitemap └─── AuthContext + PermissionGuard + ProtectedRoute      │
│   └ Footer                    └ (footer logo → /admin/login)                           │
└──────────────────────────────┬─────────────────────────────────────────────────────────┘
                               │  HTTPS / JSON  (axios, credentials, JWT in cookies)
                               ▼
┌────────────────────────── BACKEND (Express, port 5000) ────────────────────────────────┐
│  server.js  →  helmet · cors · json(15mb) · cookieParser · rateLimit                  │
│  ├ /api/auth/...        authRoutes → authController  (login/register/verify/reset/me) │
│  ├ /api/admins/...      adminRoutes → adminController (CRUD admins + roles)           │
│  ├ /api/mous/...        mouRoutes    → mouController                                 │
│  ├ /api/content/...     pageRoutes   → pageController (page content for CMS)          │
│  ├ /api/csr/...         csrRoutes    → csrController                                 │
│  ├ /api/learning/...    learningRoutes→ learningController                           │
│  ├ /api/contact/...     contactRoutes→ contactController (rate-limited)              │
│  ├ /api/client-errors/..clientErrorRoutes→ clientErrorController                     │
│  └ /api/health                                                            ─┐         │
│  Middleware: authMiddleware (JWT) · permissionMiddleware · adminMiddleware  │         │
│  Services: emailService (Gmail SMTP) · imageService (Cloudinary)            │         │
└───────────────────────────────┬─────────────────────────────────────────────┴─────────┘
                                ▼
                    MongoDB  (mongodb://127.0.0.1:27017/qaroo_cms)
   Collections: Admins · CSRProjects · LearningPrograms · MOUs · PageContent ·
                ContactMessages · ClientErrors
```

## 2. START-UP (DEV)

```
1. MongoDB  →  must be running locally on 127.0.0.1:27017 (db: qaroo_cms)
2. Backend   →  cd backend ; node server.js          (port 5000)
               Reads .env: JWT secret, admin creds, Gmail SMTP, CLIENT_URL
               Connects DB · mounts routes · listens
3. Frontend  →  npm run dev                          (port 5173)
               axios calls /api → proxied to backend :5000 (credentials: include)
4. Seed data (optional, first run) → cd backend ; node seed/runSeed.js
```

## 3. PUBLIC SITE WORKFLOW (Visitor)

```
Browser → GET / → React Router
  1. App.jsx loads Shell (Navbar · ClickSpark · NetworkStatus · Footer · Cookie banner)
  2. Lazy-loaded page loads (Suspense → LoadingState)
  3. useEffect tracks page view (analytics) + sets SEO (Seo.jsx)
  4. Page component fetches read-only data as ANONYMOUS (credentials:'omit')
  5. Data renders via cards/logos/accordions; IntersectionObserver triggers reveal
```

**Read flow per page:**
- Home → local data, FAQ JSON-LD injected via effect
- Business Solutions → `/api/content` (cached default + CMS override)
- Learning Programs → `/api/learning`
- CSR Projects → `/api/csr`
- MOU Directory → `/api/mous`
- Contact → static info from central `src/data/company.js` (+ `/api/content`)

**Contact form (the ONLY public write):** submit → `POST /api/contact` (rate-limited 10/15 min) → saves `ContactMessage` → success toast → admin sees unread count.

## 4. ADMIN CMS WORKFLOW

```
1. Entry: user clicks FOOTER LOGO (invisible link) → /admin/login
2. Login → POST /api/auth/login (rate-limited) →
     backend issues JWT access (15m) + refresh (7d) in httpOnly cookies
3. AuthContext stores user + role; ProtectedRoute guards /admin/*
4. PermissionGuard checks granular permission per route/action
   (learning.create/update, csr.*, mou.*, content, messages, admins...)
5. AdminLayout renders Sidebar + AdminNavbar + page
```

**Admin capabilities:**
| Module | Actions |
|--------|---------|
| Dashboard | Permission-aware stats (counts), retry button |
| MOU / CSR / Learning | List · Create · Edit · Delete (published/draft) |
| Content Management | Edit page content (blocks), requires any content-update permission |
| Messages | Respond to contact leads, view unread count |
| Admins (super admin) | Create/assign roles & permissions; self-delete account |
| Account | Change password (toast), forgot/reset via email |

## 5. SECURITY FLOW (request lifecycle)

```
Client request
  → helmet (security headers)
  → CORS check (origin = CLIENT_URL, credentials allowed)
  → auth routes rate-limited (authLimiter 100/15min)
  → route handler
       ├ Public GET endpoints → anonymous read of published-only docs
       ├ Public POST /api/contact → submitLimiter (10/15min)
       └ /api/auth|admin|write* → JWT verify (authMiddleware) →
              permission check (permissionMiddleware) → controller → DB
  → errorMiddleware
       ├ if 5xx in production → generic safe message (detail logged server-side)
       └ else → structured { success:false, message }
```

## 6. DATA / MODELS

- **Admin** — email, password (hashed), name, role, permissions[]
- **CSRProject** / **LearningProgram** / **MOU** — title/content, sections[], images[], tags, published flag
- **PageContent** — section/copy blocks per page (site + shared)
- **ContactMessage** — visitor enquiries (read/unread)
- **ClientError** — frontend crash reports posted to backend

## 7. TESTING → BUILD → DEPLOY

```
1. Backend  : node --check  (syntax) · node seed/runSeed.js (seed) · restart
2. Frontend : npm run build   → 901 modules, 0 errors → dist/
3. Verify admin: login via footer logo → check each module
4. Deploy   : serve dist/ + run backend with:
     - Hosted/authenticated MongoDB (replace local URI)
     - Connect Cloudinary creds for image uploads
     - Rotate JWT_SECRET to a strong value
     - Set CLIENT_URL to the live domain
```

## 8. FULL END-TO-END (one sentence)

**Visitor or admin → React (Vite) route → axios API call → Express route/middleware (JWT + permission + rate limit) → Mongoose model → MongoDB → response → toast/UI update → (admin) CMS edit saved → reflected on public site.**

## 9. DEMO / VERIFICATION CHECKLIST (data-driven Learning + Business)

Run one pass to demo/verify the fully data-driven Learning Programs + Business Solutions (no per-course JSX; all DB-backed with dynamic `/:slug` routes, dynamic Navbar, admin CRUD + SEO). Backend must be running (`node server.js`) and seeds applied (`node backend/seed/runSeed.js`). Frontend dev server on port 5173.

### Public site
- [ ] `/learning-programs` — 7 cards, whole-card clickable, links use DB slug
- [ ] `/learning-programs/:slug` (e.g. `data-science-business-analytics`) — one reusable template, all content + SEO rendered
- [ ] `/business-solutions` — 8 cards + nav pills use DB slug
- [ ] `/business-solutions/:slug` (e.g. `crm-solutions`) — one reusable template, all content + SEO rendered
- [ ] Navbar dropdowns show published-only records in displayOrder — no hardcoded list
- [ ] URLs are DB slugs, not page names (e.g. `ai-machine-learning`, `graphic-design-animation`)
- [ ] No duplicate records (learning = exactly 7, business = exactly 8)

### Admin CMS (`/admin`)
- [ ] Learning Programs + Business Solutions listed with live counts
- [ ] Edit form: rich content (lists/modules/FAQ) + SEO fields + displayOrder + status, auto-slug (editable)
- [ ] Create/Publish/Unpublish/Delete work; changes reflect on public site
- [ ] Sidebar "Business Solutions" visible to superadmin (others need `business.read`)
- [ ] All CRUD stays behind `protect + requireVerifiedApproved + requirePermission`
- [ ] Permission grid (`AdminManagement`) shows "Business Solutions" group (create/read/update/delete)

### Data/API
- [ ] `GET /api/learning` returns 7, `GET /api/business-solutions` returns 8
- [ ] `GET /api/learning/by-slug/:slug` and `GET /api/business-solutions/by-slug/:slug` return published records
- [ ] Seed is idempotent (slug upsert, never deletes); cleanup script `backend/seed/cleanupLegacyLearning.js` removes empty-slug legacy dupes
- [ ] `npm run build` passes

### Known notes
- Backend must be restarted after backend changes; I never start it (per AGENTS.md) — user restarts.
- After new/changed DB records, run `node backend/seed/runSeed.js`.
- `business.*` permissions now drive Business Solutions CRUD; the old Website-Content `business.update` blob entry was removed from the permission grid.
- `src/data/programs.js` and `src/data/businessSolutions.js` are imported by the seed scripts — do not delete.
