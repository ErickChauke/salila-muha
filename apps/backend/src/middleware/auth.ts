import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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

  const [row] = await db.select().from(users).where(eq(users.id, data.user.id)).limit(1);
  if (!row) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = {
    id: row.id,
    phone: row.phone,
    email: row.email ?? null,
    name: row.name,
    role: row.role as "customer" | "kitchen" | "admin",
    createdAt: row.createdAt.toISOString(),
  };

  next();
}

export function requireRole(...roles: Array<"customer" | "kitchen" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
