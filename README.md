# E-Davomat Backend

HR and Attendance Management System — Fastify + MongoDB + JWT.

## Project Structure

```
config/       — app config & database connection
models/       — Mongoose schemas
plugins/      — Fastify plugins (auth, core middleware)
routes/       — API route handlers
scripts/      — CLI helper scripts (seed, etc.)
services/     — business logic layer
uploads/      — uploaded files (photos)
utils/        — shared utilities
app.js        — application entry point
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and configure
cp .env.example .env

# 3. Seed default data (branch, department, position, shift)
npm run seed

# 4. Start dev server
npm run dev
```

## Create Admin User

> The `regKey` in the body must match `JWT_SECRET` from your `.env`.

```bash
curl -X POST http://localhost:8085/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"regKey":"<JWT_SECRET>","username":"admin","password":"admin123","fullName":"Admin"}'
```

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header.

```bash
# Login
curl -X POST http://localhost:8085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use returned token
curl http://localhost:8085/api/employees \
  -H "Authorization: Bearer <token>"
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Login, returns JWT |
| POST | /api/auth/create-admin | No* | Create superadmin (needs regKey) |
| GET | /api/auth/me | Yes | Current user info |
| GET | /api/dashboard/stats | Yes | Today's stats |
| GET | /api/dashboard/recent | Yes | Recent attendance |
| CRUD | /api/employees | Yes | Employee management |
| GET | /api/attendance | Yes | Attendance logs |
| CRUD | /api/shifts | Yes | Shift management |
| CRUD | /api/branches | Yes | Branch management |
| CRUD | /api/departments | Yes | Department management |
| CRUD | /api/positions | Yes | Position management |
| CRUD | /api/devices | Yes | Authorized devices |
| GET | /api/reports/* | Yes | Reports & Excel export |
| POST | /api/hikvision/event | No | Hikvision webhook |
| WS | /ws | No | Real-time attendance feed |
| GET | /api/health | No | Health check |
