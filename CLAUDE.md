# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
# Dev (both apps in parallel)
pnpm dev

# Per-app dev
pnpm dev:backend
pnpm dev:frontend

# Typecheck / lint / test / build (all apps)
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Per-app (replace backend with frontend as needed)
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter backend lint

# Database (run from EC2 or locally with DATABASE_URL set)
pnpm --filter backend db:push      # apply schema changes
pnpm --filter backend db:generate  # generate migration files

# Seed first admin (edit STAFF array first)
pnpm --filter backend tsx src/db/seed-staff.ts
```

## Workflow rules (docs/WORKFLOW.md)

- **Never push directly to main.** Feature branches + squash-merge PRs only.
- Branch naming: `feat/`, `fix/`, `refactor/`, `chore/`
- Small PRs: ~2 files changed, ~3 commits, <50 lines per commit
- **No em dashes anywhere** in code or commit messages (AI text marker)
- **No AI attribution** — never add `Co-Authored-By: Claude` or any AI tool attribution to commit messages or PR bodies
- Short, plain commit messages

CI runs on every PR: typecheck, lint, test, build. Both must pass before merge.

## Architecture

### Monorepo layout

```
apps/backend/   Express + Socket.IO + Drizzle ORM (Node, port 3001)
apps/frontend/  Next.js 14 App Router (Vercel)
packages/types/ Shared TypeScript types, consumed by both apps as @salila/types
```

### Frontend -> Backend connection

The frontend never calls the backend directly in production. `next.config.js` rewrites `/api/*` and `/socket.io/*` to the EC2 IP (`http://13.244.64.123`). This means `NEXT_PUBLIC_API_URL` is intentionally empty on Vercel. Socket.IO is forced to HTTP long-polling because Vercel does not support persistent WebSocket connections.

### Backend structure

```
src/
  index.ts          Entry point: Express + Socket.IO setup, CORS (WEB_URL env)
  routes/           Thin routers, no logic
  services/         All business logic lives here
  db/
    index.ts        Drizzle client (node-postgres Pool, DATABASE_URL)
    schema/         Table definitions - users, menu_items, orders
  middleware/
    auth.ts         requireAuth (Supabase JWT verify + RDS user lookup)
                    requireRole(...roles) (checks req.user.role)
    error.ts        Global error handler
  lib/socket.ts     Socket.IO setup, emits order:new and order:updated
  types/express.d.ts  Extends Express Request with user?: User
```

All prices are stored as **integers (cents)**. `200` = R2.00.

Order status flow: `pending` → `accepted` → `preparing` → `ready` → `collected` | `rejected`

### Auth model

Supabase handles identity only. Roles and all user data live in the RDS `users` table.

- **Customers**: Google Sign-In (primary), others to be added. Account created automatically on first OAuth login.
- **Kitchen / Admin staff**: Email OTP via Supabase (`shouldCreateUser: false` — only pre-seeded emails work). Managed via admin invite UI (in progress); seed script is the emergency fallback.

Auth flow for staff: Supabase OTP → JWT → `GET /api/auth/me` (Bearer token) → backend verifies JWT + looks up role in RDS → redirect to `/kitchen` or `/admin`.

Protected routes:
- `PATCH /api/orders/:id/status` — requires kitchen or admin role
- `GET /api/auth/me` — requires valid session
- `/kitchen`, `/admin` — Next.js middleware redirects to `/login` if no session cookie

The `AuthProvider` context (`src/context/auth.tsx`) exposes `useAuth()` → `{ user, session, loading, logout }`. It hydrates by calling `/api/auth/me` on mount.

### Database schema (key points)

- `users.id` = Supabase Auth UUID (primary key, text)
- `orders.items` = JSONB array of `OrderItem[]`
- `orders.customerId` is nullable (guest orders have no account)
- All schema changes go through `drizzle-kit push` — no raw SQL migrations

### Frontend structure

```
src/app/              App Router pages
  page.tsx            Customer ordering flow (menu → cart → checkout)
  login/page.tsx      Staff login (email OTP, two-step)
  kitchen/page.tsx    Kitchen dashboard (stub, to be expanded)
  track/[id]/page.tsx Order tracking with live Socket.IO updates
  pay/success|cancelled  PayFast redirect pages
src/context/auth.tsx  AuthProvider + useAuth hook
src/lib/
  api.ts              apiFetch(path, init?, token?) wrapper
  supabase.ts         createSupabaseBrowserClient()
src/middleware.ts     Route guard for /kitchen and /admin
```

### Environment variables

See `.env.example` for the full list. Key ones:

| Variable | Where needed |
|----------|-------------|
| `DATABASE_URL` | Backend |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Backend |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (Vercel env vars) |
| `WEB_URL` | Backend (CORS origin) |
| `PAYFAST_*` | Backend |

### Infrastructure

- **Frontend**: Vercel, auto-deploys on push to `main`
- **Backend**: EC2 t3.micro af-south-1, PM2 process manager, Nginx on port 80
- **Database**: RDS PostgreSQL af-south-1
- **Images**: S3 af-south-1 (menu item photos)
- **Payments**: PayFast (sandbox mode; see `docs/DEPLOYMENT.md` for go-live checklist)

### Design tokens (globals.css)

```
--color-primary: #E07A3C   (orange)
--color-bg:      #FBF2E4   (cream)
--color-ink:     #2B1E14   (dark brown)
--font-display:  Caveat     (headings / wordmark)
--font-body:     Archivo    (UI text)
```

Reference UI designs are in `design_prototype/`. Key variants:
- `kitchen-variants.jsx` — K1 Kanban layout (target for kitchen dashboard)
- `support-variants.jsx` — AuthSignIn design
- `tracking-variants.jsx` — T1 vertical timeline (used in /track/[id])
