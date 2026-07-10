# 🍳 Recipe Box

A full-stack recipe management application built with Next.js, Express, and PostgreSQL.

## Architecture

```
recipe-box/
├── app/              # Next.js 14 App Router (frontend)
├── components/       # React components
├── src/              # Frontend utilities (api.ts, types.ts)
├── backend/          # Express + TypeScript API
│   └── src/
│       ├── index.ts  # Server entry point
│       ├── db.ts     # PostgreSQL connection
│       ├── routes/   # API route handlers
│       └── middleware/
└── database/
    └── schema.sql    # Database schema + seed data
```

## Features

- 📖 Browse recipes in a responsive grid
- 🔍 Search recipes by title/description
- 🏷️ Filter by category and difficulty
- ❤️ Save favorites (requires account)
- ➕ Add, edit, and delete recipes
- 🔐 User authentication (JWT)
- 🌱 Pre-seeded with 8 real recipes

## Environment Variables

### Frontend (root `.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/recipebox
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://localhost:3000
```

## Local Development

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb recipebox

# Apply schema and seed data
psql recipebox < database/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
# API running at http://localhost:4000
```

### 3. Frontend
```bash
# From root directory
npm install
npm run dev
# App running at http://localhost:3000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login |
| GET | `/api/recipes` | No | List recipes (search/filter) |
| GET | `/api/recipes/:id` | No | Get recipe details |
| POST | `/api/recipes` | Optional | Create recipe |
| PUT | `/api/recipes/:id` | Yes | Update recipe |
| DELETE | `/api/recipes/:id` | Yes | Delete recipe |
| GET | `/api/categories` | No | List categories |
| POST | `/api/categories` | Yes | Create category |
| DELETE | `/api/categories/:id` | Yes | Delete category |
| GET | `/api/favorites` | Yes | Get user favorites |
| POST | `/api/favorites` | Yes | Add to favorites |
| DELETE | `/api/favorites/:id` | Yes | Remove from favorites |

## Demo Account

Email: `demo@recipebox.app`  
Password: `demo1234`

## Railway Deployment

1. Create a Railway project
2. Add a PostgreSQL plugin
3. Deploy backend service:
   - Root: `backend/`
   - Build: `npm run build`
   - Start: `npm start`
   - Set `DATABASE_URL` (from Railway PostgreSQL), `JWT_SECRET`, `PORT`
4. Deploy frontend service:
   - Root: `/`
   - Build: `npm run build`
   - Start: `npm start`
   - Set `NEXT_PUBLIC_API_URL` to backend URL
5. Run `database/schema.sql` via Railway's PostgreSQL console
