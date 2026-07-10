# 🍳 Recipe Box

Recipe Box is a full-stack recipe manager with a Next.js frontend, an Express + TypeScript API, and a PostgreSQL database with seed data.

It ships with recipe browsing, search, category and difficulty filters, favorites, authentication, recipe CRUD, and a seeded demo account so the app can be exercised quickly in local development or on Railway.

## What was built for ABH-10

- Responsive recipe grid with modern card-based UI
- Search by title/description
- Category sidebar filters
- Difficulty filters (`easy`, `medium`, `hard`)
- Recipe detail view with ingredients and step-by-step instructions
- Add, edit, and delete recipe flows
- User signup/login with JWT-based auth
- Favorites API + UI behavior for signed-in users
- PostgreSQL schema with categories, recipes, ingredients, favorites, and demo seed data
- Express health endpoint at `/health`

## Tech stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- App Router

### Backend
- Node.js
- Express
- TypeScript
- `pg` for PostgreSQL access
- `jsonwebtoken` + `bcryptjs` for auth

### Database
- PostgreSQL
- SQL schema + seed file in `database/schema.sql`

## Repository structure

```text
.
├── app/                    # Next.js app shell
├── components/             # UI components (grid, detail, form, auth, toast)
├── src/                    # frontend API client + shared frontend types
├── backend/                # Express + TypeScript API service
│   ├── src/index.ts
│   ├── src/db.ts
│   ├── src/middleware/
│   └── src/routes/
├── database/
│   └── schema.sql          # PostgreSQL schema and seed data
└── docs/
    ├── ABH-10-architect-plan.md
    └── IMPLEMENTATION_NOTES.md
```

## Local setup

### 1) Install dependencies

Install the frontend/root dependencies:

```bash
npm install
```

Install the backend dependencies:

```bash
cd backend
npm install
cd ..
```

### 2) Create and seed PostgreSQL

Create a local database:

```bash
createdb recipebox
```

Apply the schema and seed data:

```bash
psql recipebox < database/schema.sql
```

### 3) Configure environment variables

#### Frontend (`.env.local` at repo root)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://localhost:5432/recipebox
PORT=4000
JWT_SECRET=change-this-in-real-environments
FRONTEND_URL=http://localhost:3000
```

> `DATABASE_URL` should be updated to match your local PostgreSQL credentials.

## Running the app

### Run the backend

```bash
cd backend
npm run dev
```

Backend URLs:
- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- Recipes: `http://localhost:4000/api/recipes`

### Run the frontend

In a separate shell from the repo root:

```bash
npm run dev
```

Frontend URL:
- App: `http://localhost:3000`

## Demo account

Use the seeded demo account:

- Email: `demo@recipebox.app`
- Password: `demo1234`

## API overview

### Health
- `GET /health`

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `DELETE /api/categories/:id`

### Recipes
- `GET /api/recipes`
- `GET /api/recipes/:id`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

Supported recipe list query params:
- `q`
- `category`
- `difficulty`
- `page`
- `limit`

### Favorites
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:recipeId`

## Deployment notes

This repo is organized as a two-service layout:
- frontend at the repo root
- backend in `backend/`

For Railway-style deployment:

### Backend service
- Root directory: `backend/`
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`
- Required env:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PORT`
  - `FRONTEND_URL`

### Frontend service
- Root directory: `/`
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`
- Required env:
  - `NEXT_PUBLIC_API_URL` pointing at the deployed backend base URL

### Database
- Provision PostgreSQL
- Run `database/schema.sql` against the deployed database to create tables and seed initial data

## Notes for reviewers / handoff

- The frontend stores auth state in local storage (`rb_user`, `rb_token`)
- Favorites are cached per-user in local storage and refreshed from the API
- Recipe create allows optional auth; edit/delete/favorites require auth
- Ingredients are stored in a dedicated `ingredients` table
- Instructions are stored as JSON text in the `recipes.instructions` column and parsed by the API

Additional architecture details are documented in `docs/IMPLEMENTATION_NOTES.md`.
