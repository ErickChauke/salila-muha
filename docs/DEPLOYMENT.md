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
| Payments | PayFast | Sandbox mode (account approval pending) |

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

### EC2 `.env` (backend)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | RDS connection string with `?sslmode=no-verify` |
| `PORT` | `3001` |
| `WEB_URL` | Vercel frontend URL (for CORS) |
| `SMTP_*` | Gmail app password credentials |
| `AWS_*` | S3 credentials |
| `PAYFAST_MERCHANT_ID` | From PayFast dashboard |
| `PAYFAST_MERCHANT_KEY` | From PayFast dashboard |
| `PAYFAST_PASSPHRASE` | Set in PayFast dashboard under Settings |
| `PAYFAST_SANDBOX` | `true` (sandbox) or `false` (live) |
| `FRONTEND_URL` | `https://salila-muha.vercel.app` |
| `BACKEND_URL` | `http://13.244.64.123` |

## Database

RDS PostgreSQL with Drizzle ORM. Schema lives in `apps/backend/src/db/schema/`.

Tables: `users`, `menu_items`, `orders` plus enums `order_status`, `menu_category`.

To sync schema changes to the database, SSH into EC2 and run:

```bash
cd /home/ec2-user/salila-muha
pnpm --filter backend db:push
```

RDS is in the same VPC as EC2, so `db:push` must be run from EC2 (not locally).

## TODO - PayFast go-live checklist

Once the PayFast merchant account is approved, complete these steps in order:

### 1. Update EC2 env vars with real credentials

SSH into EC2 and run:

```bash
sed -i 's/^PAYFAST_MERCHANT_ID=.*/PAYFAST_MERCHANT_ID=your_real_id/' ~/salila-muha/.env
sed -i 's/^PAYFAST_MERCHANT_KEY=.*/PAYFAST_MERCHANT_KEY=your_real_key/' ~/salila-muha/.env
sed -i 's/^PAYFAST_PASSPHRASE=.*/PAYFAST_PASSPHRASE=your_real_passphrase/' ~/salila-muha/.env
pm2 restart api
```

Credentials are found in the PayFast dashboard under My Account > Settings > Integration.

### 2. Test in sandbox mode first

Keep `PAYFAST_SANDBOX=true` and place a test card order end-to-end:
- Order redirects to `sandbox.payfast.co.za`
- Complete payment with PayFast test card details
- Check backend logs: `pm2 logs api --lines 30`
- Verify order status in DB changes to `accepted`
- Confirm `/pay/success?order_id=<id>` page loads and links to tracking

### 3. Switch to live mode

Once sandbox testing passes:

```bash
sed -i 's/^PAYFAST_SANDBOX=.*/PAYFAST_SANDBOX=false/' ~/salila-muha/.env
pm2 restart api
```

### 4. Set up PayFast ITN URL in dashboard

In the PayFast dashboard under Settings > Integration, set the notify URL to:

```
http://13.244.64.123/api/payments/notify
```

This is also set automatically via the `BACKEND_URL` env var in code, but confirming it in the dashboard ensures PayFast retries on failure.
