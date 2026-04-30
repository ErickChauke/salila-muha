# Salila Muha - Kota Store App

pnpm monorepo for a kota store ordering and kitchen management system.

## Structure

```
apps/
  backend/   Express + Socket.IO + Drizzle ORM (Node.js)
  frontend/  Next.js 14 (App Router)
packages/
  types/     Shared TypeScript types (MenuItem, Order, OrderItem, etc.)
docs/
  DEPLOYMENT.md   Full infra details
  WORKFLOW.md     PR rules and branching guide
```

## Stack

| Layer | Service |
|---|---|
| Frontend | Vercel (auto-deploys on push to main) |
| Backend | AWS EC2 t3.micro af-south-1, PM2 + Nginx |
| Database | AWS RDS PostgreSQL af-south-1 |
| Auth | Supabase (auth only, data in RDS) |
| Storage | AWS S3 af-south-1 |
| Payments | Yoco (test mode) |

Frontend URL: `https://salila-muha-ericks-projects-95809d73.vercel.app`  
Backend URL: `http://13.244.64.123` (proxied via Next.js rewrites at `/api/*` and `/socket.io/*`)

## Local dev

```bash
# Install
pnpm install

# Frontend (localhost:3000)
cd apps/frontend && pnpm dev

# Backend (localhost:3001)
cd apps/backend && pnpm dev
```

## API

| Method | Path | Description |
|---|---|---|
| GET | /api/menu | List all menu items |
| POST | /api/menu | Create menu item |
| PATCH | /api/menu/:id | Update menu item |
| DELETE | /api/menu/:id | Delete menu item |
| GET | /api/orders | List all orders |
| POST | /api/orders | Create order (status: pending) |
| PATCH | /api/orders/:id/status | Update order status |
| POST | /api/payments/charge | Process Yoco card payment |

## Order status flow

```
pending -> accepted (after Yoco charge) -> preparing -> ready -> collected
       -> rejected
```

## Real-time

Socket.IO (HTTP long-polling via Vercel rewrite). All clients join the `kitchen` room.

| Event | Payload | When |
|---|---|---|
| `order:new` | Full Order object | New order created |
| `order:updated` | `{ id, status, updatedAt }` | Status changed |

## What's built

- [x] Menu browse - home page shows items by category with add-to-cart
- [x] Cart - qty controls per item, sticky total bar
- [x] Checkout form - name + phone, cash or card paths
- [x] Order submit - POST /api/orders, redirect to /track/[id]
- [x] Kitchen dashboard scaffold - /kitchen page (order count only)

## What's next

- [ ] Order tracking page - /track/[id] (customer-facing status timeline)
- [ ] Kitchen dashboard - full order cards with accept/reject/ready/collected actions
- [ ] Menu management - admin CRUD for menu items
