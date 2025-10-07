# Finansik API

Backend for personal finance app. Stack: Node.js, TypeScript, Express, PostgreSQL, Prisma.

## Run with Docker

1. Create `.env` (copy from `.env.example`).
2. Start: `docker compose up --build`.
3. API at `http://localhost:3000`, health check `/health`.

## Dev locally

- Install Node 20+, Postgres 16+
- `npm install`
- Set `DATABASE_URL` in `.env`
- `npx prisma migrate dev`
- `npm run dev`

## Endpoints

- POST `/api/auth/signup` { login, password, visualname? }
- POST `/api/auth/login` { login, password }

More routes to come: categories, operations, assets, savings, goals, loans, notifications, reports, analytics.



