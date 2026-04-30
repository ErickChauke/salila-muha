import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

export const authRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

authRouter.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }

  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid auth token" });
    return;
  }

  let [row] = await db.select().from(users).where(eq(users.id, data.user.id)).limit(1);

  if (!row) {
    const [created] = await db
      .insert(users)
      .values({
        id: data.user.id,
        email: data.user.email ?? null,
        name:
          (data.user.user_metadata?.full_name as string | undefined) ??
          data.user.email ??
          "Customer",
        phone: null,
        role: "customer",
      })
      .returning();
    row = created;
  }

  res.json({
    id: row.id,
    phone: row.phone,
    email: row.email ?? null,
    name: row.name,
    role: row.role as "customer" | "kitchen" | "admin",
    createdAt: row.createdAt.toISOString(),
  });
});
