# Auth Guide - Salila Muha

Three parties access the system. This document covers how each party logs in and how to
manage staff accounts.

---

## Who logs in

| Party | How | Where |
|-------|-----|--------|
| Customer | No login. Enter name + phone at checkout. | `/` |
| Kitchen staff | Email OTP (6-digit code sent by Supabase) | `/kitchen` |
| Admin | Email OTP, same flow | `/admin` |

Customers are never asked to create an account. Kitchen and admin accounts must be
created by a developer using the seed script below.

---

## How staff login works

1. Staff go to `/login`
2. Enter email address
3. Supabase sends a 6-digit code to that email (valid for 5 minutes)
4. Staff enter the code
5. App checks their role in the database and redirects:
   - `kitchen` role -> `/kitchen`
   - `admin` role -> `/admin`

> Only pre-seeded emails can log in. If someone enters an email that is not in the
> database they see: "No account found for this email."

---

## Adding a new staff member

### Step 1 - Edit the seed file

Open `apps/backend/src/db/seed-staff.ts` and add a line to the `STAFF` array:

```ts
const STAFF = [
  { name: "Erick",  email: "erick@salilamuha.co.za",  phone: "+27000000000", role: "admin" },
  { name: "Lwazi",  email: "lwazi@salilamuha.co.za",  phone: "+27000000001", role: "kitchen" },
  // add more here
];
```

**Fields:**
- `name` - display name (shown in kitchen dashboard later)
- `email` - the email they will use to log in
- `phone` - placeholder is fine (e.g. `"+27000000002"`); can update later
- `role` - `"kitchen"` or `"admin"`

### Step 2 - Run the script

From the project root:

```bash
pnpm --filter backend tsx src/db/seed-staff.ts
```

The script will:
1. Create the user in Supabase Auth (they do NOT receive an email yet)
2. Insert the user record in the RDS `users` table with their role

### Step 3 - Tell the staff member

Send them the login URL: `https://salila-muha.vercel.app/login`

The first time they sign in, Supabase will send the OTP to their email.

### Step 4 (optional) - Confirm it worked

In your RDS database, run:

```sql
SELECT id, name, email, role FROM users;
```

You should see a row for the new staff member.

---

## Removing a staff member

1. In the Supabase dashboard -> Authentication -> Users -> find their email -> Delete
2. In the RDS database:

```sql
DELETE FROM users WHERE email = 'their@email.co.za';
```

---

## Changing a staff member's role

Update the role in the RDS `users` table:

```sql
UPDATE users SET role = 'admin' WHERE email = 'their@email.co.za';
```

No change needed in Supabase - roles are stored in RDS only.

---

## How authentication works (technical overview)

```
Login flow
----------
1. /login page -> supabase.auth.signInWithOtp({ email, shouldCreateUser: false })
   - If email not in Supabase Auth: error shown to user
   - If found: Supabase emails a 6-digit OTP

2. /login page -> supabase.auth.verifyOtp({ email, token, type: "email" })
   - Returns a Supabase session (JWT)

3. Frontend -> GET /api/auth/me  (Authorization: Bearer <jwt>)
   - Backend verifies JWT with Supabase service role key
   - Looks up user in RDS users table by Supabase UUID
   - Returns { id, name, email, phone, role, createdAt }

4. Frontend redirects to /kitchen or /admin based on role
```

```
API protection
--------------
PATCH /api/orders/:id/status  requires kitchen or admin role
GET   /api/auth/me            requires any valid session

All other routes are public (menu, order creation, order tracking, payments).
```

```
Route guard (Next.js middleware)
---------------------------------
/kitchen  -> redirects to /login if no Supabase session cookie
/admin    -> redirects to /login if no Supabase session cookie
/login    -> redirects to /kitchen or /admin if already logged in
```

---

## Environment variables

These must be set on both local `.env` and on the EC2 server:

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Backend (EC2) | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (EC2) | Verify JWTs + create users via admin API |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend (Vercel) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (Vercel) | Public key for OTP flow |

To add to Vercel: Vercel dashboard -> Project -> Settings -> Environment Variables.
To add to EC2: SSH in and run:

```bash
# append to /etc/environment or your app's .env file
echo 'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co' >> /path/to/.env
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key' >> /path/to/.env
```

See `docs/DEPLOYMENT.md` for the full EC2 setup.

---

## Supabase dashboard (what to check if login breaks)

1. Go to your Supabase project -> Authentication -> Users
2. Confirm the staff member's email appears and is confirmed
3. Under Authentication -> Configuration -> Email, make sure OTP is enabled
4. Check that the OTP expiry is set (default 3600 seconds = 1 hour is fine)
