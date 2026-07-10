# ABH-10: Recipe Box

Build a full-stack Recipe Box app. Frontend (Next.js + Tailwind): recipe grid, search, category filters, detail page, add-recipe form, modern UI. Backend (Node/Express + TypeScript): REST API for recipes & categories (list/search/get/create/update/delete) + a `/health` endpoint. Database (PostgreSQL): `categories`, `recipes`, `favorites` tables with seed data. Wire frontend→backend→database, follow the standard monorepo structure so it deploys to Railway.


---
## FULL-STACK TECH CONTRACT (mandatory unless the request is explicitly frontend/static-only)

Deliver a REAL, wired-together full-stack app — buttons and forms MUST perform real actions that persist to a database via a backend API. Do NOT ship a static frontend with mocked data.

**Repository layout (monorepo):**
- **Frontend** (repo root): Next.js 14 App Router + TypeScript. The UI is a client app that fetches live data from the backend using `process.env.NEXT_PUBLIC_API_URL`.
- **Backend** (`backend/`): Node.js + Express + TypeScript using the `pg` driver. Reads `process.env.DATABASE_URL` and `process.env.PORT` (default 4000). Exposes `GET /health`, full CRUD REST endpoints for the domain, and auth (`POST /auth/signup`, `POST /auth/login` returning a JWT). `backend/package.json` must define scripts `build` (tsc), `start` (node dist/index.js) and `main` = `dist/index.js`.
- **Database** (`database/schema.sql`): `CREATE TABLE IF NOT EXISTS` statements for a `users` table (email UNIQUE + password_hash) and all domain tables. This file is auto-applied by the deploy pipeline.

**Wiring rules:**
- Frontend → Backend over HTTP via `NEXT_PUBLIC_API_URL` (the deploy pipeline injects this automatically).
- Backend → Database via `DATABASE_URL` (the deploy pipeline injects this automatically). Use parameterized queries. Enable Postgres SSL when the URL points at RDS/AWS.
- Keep imports/exports consistent so every `npm run build` succeeds for both apps.
