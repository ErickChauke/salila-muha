# Deployment

## Live URLs

| Layer | URL |
|---|---|
| Frontend | `https://salila-muha-ericks-projects-95809d73.vercel.app` |
| Backend API | `http://13.244.64.123` |
| Health check | `http://13.244.64.123/health` |

## Infrastructure

| Service | Provider | Details |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| Backend | AWS EC2 t3.micro | `af-south-1`, PM2 + Nginx, port 80 |
| Database | AWS RDS PostgreSQL | `af-south-1`, free tier, SSL required |
| Auth | Supabase | Hosted auth only, data lives in RDS |
| Storage | AWS S3 | `af-south-1`, for menu item images |
| Payments | Yoco | Test mode (pending approval) |

## How deploys work

**Frontend** - Vercel detects a push to `main` and auto-builds. Takes about 1 minute.

**Backend** - GitHub Actions SSHs into EC2, runs `git reset --hard origin/main`, builds, and restarts PM2. Takes about 2 minutes.

Both are triggered automatically on merge to `main`. No manual steps needed.

## Frontend - Backend connection

The frontend is HTTPS (Vercel) and the backend is HTTP (EC2 with no domain). To avoid mixed content errors, the frontend uses Next.js rewrites to proxy API and Socket.IO traffic through Vercel:

- `/api/*` → `http://13.244.64.123/api/*`
- `/socket.io/*` → `http://13.244.64.123/socket.io/*`

The browser only ever talks to the Vercel domain. Vercel proxies to EC2 server-side.

`NEXT_PUBLIC_API_URL` is intentionally left empty in Vercel. For local dev, set it to `http://localhost:3001` in your `.env` file.

**Socket.IO note:** Vercel does not support persistent WebSocket connections. Socket.IO falls back to HTTP long-polling automatically, which works through the proxy. Real-time updates still function - just slightly less efficient than native WebSocket.

## Environment variables

### Vercel (frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | _(empty - uses Vercel proxy rewrites)_ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ooomesctuzdqdknqxjka.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_SefS311lbyp7NjBsS24akA_Qbr0v0Qf` |
| `NEXT_PUBLIC_YOCO_PUBLIC_KEY` | `pk_test_placeholder` |

### EC2 `.env` (backend)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | RDS connection string with `?sslmode=no-verify` |
| `PORT` | `3001` |
| `WEB_URL` | Vercel frontend URL (for CORS) |
| `SMTP_*` | Gmail app password credentials |
| `AWS_*` | S3 credentials |

## Database

RDS PostgreSQL with Drizzle ORM. Schema lives in `apps/backend/src/db/schema/`.

Tables: `users`, `menu_items`, `orders` plus enums `order_status`, `menu_category`.

To sync schema changes to the database, SSH into EC2 and run:

```bash
cd /home/ec2-user/salila-muha
pnpm --filter backend db:push
```

RDS is in the same VPC as EC2, so `db:push` must be run from EC2 (not locally).
