# Salila Muha - Sprint Plan

Work to complete across sessions. Tell the next Claude instance: "Read docs/SPRINTS.md and
continue from the first incomplete sprint." Delete this file once all sprints are done.

Current stack reminder: pnpm monorepo, Express backend (EC2), Next.js 14 frontend (Vercel),
RDS PostgreSQL + Drizzle ORM, Supabase auth (JWT only, roles in RDS). See CLAUDE.md for
commands and architecture.

---

## Sprint 1 - Customer Google Sign-In

**Goal:** Customers can sign in with Google. Account created automatically on first login.
Staff login (email OTP) stays on a separate path.

### Backend changes

**`apps/backend/src/routes/auth.ts`**
- Update `GET /api/auth/me` to auto-create a customer record in RDS if the Supabase user
  exists but has no row in the `users` table yet. Insert with `role: "customer"`, name from
  Supabase user metadata (`user.user_metadata.full_name`), email from `user.email`, phone `""`.
  This handles the first Google login without any extra step.

### Frontend changes

**`apps/frontend/src/app/login/page.tsx`**
- Add a "Continue with Google" button above the email OTP form.
- Button calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback" } })`.
- Split the page visually: Google button for customers, email OTP section labelled "Staff sign in".

**`apps/frontend/src/app/auth/callback/route.ts`** (new - Next.js Route Handler)
- Exchange the OAuth `code` param for a session: use `createServerClient` from `@supabase/ssr`,
  call `supabase.auth.exchangeCodeForSession(code)`.
- After exchange, call `GET /api/auth/me` with the new access token so the customer record is
  auto-created in RDS (see backend change above).
- Read role from response, redirect: `customer` → `/`, `kitchen` → `/kitchen`, `admin` → `/admin`.

**`apps/frontend/src/context/auth.tsx`**
- No structural change needed. `onAuthStateChange` will fire after the OAuth callback and
  hydrate the context automatically.

### Supabase dashboard setup (one-time, done by developer)
- Authentication → Providers → Google → enable, paste Google OAuth client ID + secret.
- Authentication → URL Configuration → add `https://salila-muha.vercel.app/auth/callback`
  to Redirect URLs.
- For local dev add `http://localhost:3000/auth/callback` too.

### Verification
- Click "Continue with Google", pick a Google account, land on home page as a customer.
- `GET /api/auth/me` returns `{ role: "customer", name: "...", email: "..." }`.
- Repeat login with same account - no duplicate row created in `users` table.
- Staff email OTP path still works independently.

---

## Sprint 2 - Customer Checkout Gate + Profile

**Goal:** Customers must be signed in to place an order. Phone is optional. Order is linked
to their account so they can track it even after closing the tab.

### Schema change

**`apps/backend/src/db/schema/users.ts`**
- Add `notifyBySms: boolean("notify_by_sms").notNull().default(false)`.
- Run `pnpm --filter backend db:push` after merging.

### Backend changes

**`apps/backend/src/routes/orders.ts`**
- `POST /api/orders` - no auth required (kitchen can still create test orders), but if a
  Bearer token is present, extract `req.user.id` and set `customerId` on the order.
- Apply optional auth: call `requireAuth` only when the Authorization header is present,
  otherwise skip. Implement a `optionalAuth` middleware in `auth.ts` for this.

**`apps/backend/src/routes/auth.ts`**
- Add `PATCH /api/auth/me` - lets a logged-in customer update `phone` and `notifyBySms`.
  Requires `requireAuth`. Only updates those two fields.

### Frontend changes

**`apps/frontend/src/app/page.tsx`** (home/ordering page)
- At the point the user clicks "Checkout" / "Place order", check `useAuth().user`.
- If not logged in: save cart to `sessionStorage`, redirect to `/login?next=/`.
- After login the auth callback redirects back to `/`, restore cart from `sessionStorage`.

**Checkout form** (within `page.tsx` or its own component)
- Pre-fill `customerName` from `user.name` (editable).
- Add optional phone field. If filled in, also show SMS opt-in checkbox.
- On submit: pass `session.access_token` as the third arg to `apiFetch` so `customerId`
  gets attached to the order.
- After order created, update user's phone + notifyBySms via `PATCH /api/auth/me` if
  phone was provided (fire-and-forget, don't block the redirect).

**`apps/frontend/src/app/track/[id]/page.tsx`**
- No auth required to view (order ID in URL is enough). Keep it public.
- If user is logged in and `order.customerId === user.id`, show a "My orders" link.

### Verification
- Not logged in → click checkout → redirected to `/login` → sign in → back on page with
  cart intact → complete order → order row has `customerId` set.
- Logged-in user fills phone + checks SMS opt-in → `users` row updated.
- Guest tab (no account) cannot reach checkout - redirected to login.

---

## Sprint 3 - Admin Staff Management UI

**Goal:** Admin manages all staff from `/admin/staff`. No terminal commands needed after
the first admin is seeded.

### Backend changes

**`apps/backend/src/routes/admin.ts`** (new file)

Protect all routes with `requireAuth, requireRole("admin")`.

- `GET /api/admin/staff` - return all users where `role IN ('kitchen', 'admin')`.
- `POST /api/admin/staff/invite` - body: `{ name, email, role }`.
  1. Call `supabase.auth.admin.createUser({ email, email_confirm: true })` to create the
     Supabase account.
  2. If already exists in Supabase, fetch their UUID via `listUsers`.
  3. Upsert into RDS `users` table with given name, role, placeholder phone.
  4. Send welcome email via nodemailer (already installed): subject "You have been added to
     Salila Muha", body includes the login URL and instructions.
  5. Return the created user.
- `PATCH /api/admin/staff/:id` - body: `{ role }`. Update role in RDS only. Return updated user.
- `DELETE /api/admin/staff/:id` - disable in Supabase:
  `supabase.auth.admin.deleteUser(id)`, then delete from RDS `users`. Return `{ ok: true }`.

Register in `apps/backend/src/routes/index.ts`: `router.use("/admin", adminRouter)`.

### Frontend changes

**`apps/frontend/src/app/admin/layout.tsx`** (new)
- Simple layout: sidebar with nav links (Staff, Menu - future). No auth check needed here
  since middleware already guards `/admin`.

**`apps/frontend/src/app/admin/staff/page.tsx`** (new)

Three sections:
1. **Staff list** - table of current kitchen + admin users. Columns: Name, Email, Role
   (dropdown to change: kitchen ↔ admin), Remove button. Calls `PATCH` or `DELETE` on change.
2. **Invite form** - Name, Email, Role (select: kitchen / admin), "Send invite" button.
   Calls `POST /api/admin/staff/invite`. Shows success/error inline.
3. **Note** - "Removed staff lose access immediately. They receive no notification."

Use `useAuth().session.access_token` for all API calls. Use `apiFetch` with token arg.

### Verification
- Admin visits `/admin/staff` - sees existing staff list.
- Invites a new kitchen email - Supabase user created, welcome email received, row in RDS.
- New staff member goes to `/login`, enters email, gets OTP, signs in, lands on `/kitchen`.
- Admin changes that staff member's role to admin - role updates immediately in DB.
- Admin removes the staff member - they can no longer sign in (Supabase account deleted).
- Non-admin user hitting `/admin/staff` gets 403 from backend (middleware already covers the
  frontend redirect).

---

## Sprint 4 - Kitchen Dashboard (K1 Kanban)

**Goal:** Kitchen staff see live orders in a Kanban board and can action them. Reference
design: `design_prototype/kitchen-variants.jsx` K1 variant.

### Backend changes

No new routes needed. All existing:
- `GET /api/orders` - returns all orders (kitchen uses this to load initial state)
- `PATCH /api/orders/:id/status` - already protected by `requireAuth + requireRole`
- Socket.IO `order:new` and `order:updated` events already emit on changes

**`apps/backend/src/services/orders.service.ts`**
- Confirm `updateStatus` emits `order:updated` after every status change (check current
  implementation - add emit if missing).

### Frontend changes

**`apps/frontend/src/app/kitchen/page.tsx`** - full replacement of the stub.

Layout: three columns matching K1 design.

| Column | Statuses shown | Actions on card |
|--------|---------------|-----------------|
| NEW | `pending` | Accept, Reject |
| PREPARING | `accepted`, `preparing` | Mark Ready |
| READY | `ready` | Collected |

Each order card shows: order ID (last 4 chars), customer name, items list, total, time since
order placed.

Data flow:
- On mount: `apiFetch("/api/orders", {}, session.access_token)` - load all orders.
- Socket: connect to `/socket.io`, join `kitchen` room, listen for `order:new` and
  `order:updated`, update local state.
- Action buttons: call `apiFetch("PATCH /api/orders/:id/status", { method: "PATCH", body:
  JSON.stringify({ status }) }, session.access_token)`.

Chrome bar (top strip): total orders today, pause button (future - just UI for now).

Use `useAuth` to get session token. If session is null (should not happen due to middleware),
redirect to `/login`.

### Socket.IO note
Frontend socket client must send the auth token so kitchen room join is authenticated.
Pass token in socket handshake: `io({ auth: { token: session.access_token } })`.
Update `apps/backend/src/lib/socket.ts` to verify the token on connection before allowing
join of the `kitchen` room.

### Verification
- Kitchen staff logs in, sees all pending orders in NEW column.
- Click Accept → card moves to PREPARING column in real time (test with two browser tabs).
- Click Mark Ready → moves to READY.
- Click Collected → card disappears (status = collected, filter it out of view).
- Click Reject → card disappears from NEW (status = rejected).
- New order placed on home page → appears in NEW column without refresh.

---

## Sprint 5 - SMS Notifications (Africa's Talking)

**Goal:** Customers who opted in receive an SMS when their order is ready.

### Provider setup (one-time)
- Sign up at africastalking.com (SA coverage, pay-as-you-go, cheaper than Twilio in ZA).
- Get API key + username, add to EC2 `.env`:
  `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID` (optional, e.g. "SALILAMUHA").
- Install SDK: `pnpm --filter backend add africastalking`.

### Backend changes

**`apps/backend/src/services/sms.service.ts`** (new)
```
sendSms(to: string, message: string): Promise<void>
```
- Initialise Africa's Talking with `AT_USERNAME` + `AT_API_KEY`.
- Call `AT.SMS.send({ to: [to], message, from: AT_SENDER_ID })`.
- Log success/failure - never throw (SMS failure must not break order flow).

**`apps/backend/src/services/orders.service.ts`** - `updateStatus` function
- After status is set to `"ready"`:
  1. Fetch the order's `customerId`.
  2. If set, fetch the user row - check `notifyBySms` and `phone`.
  3. If both true/present, call `sendSms(phone, "Your kota is ready for pickup! - Salila Muha")`.

### Verification
- Customer adds phone + enables SMS opt-in at checkout.
- Kitchen marks order as ready.
- Customer receives SMS within ~10 seconds.
- Customer with no phone or opt-in unchecked → no SMS sent, no error.
- SMS failure (invalid number) → error logged, order status still updated correctly.

---

## Done when

All 5 sprints verified. Delete this file and update `docs/DEPLOYMENT.md` with any new env
vars added (AT_API_KEY, AT_USERNAME, AT_SENDER_ID, Google OAuth credentials).
