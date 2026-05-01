import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { db } from "../db";
import { users } from "../db/schema/users";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

adminRouter.get("/staff", requireAuth, requireRole("admin"), async (_req, res) => {
  const staff = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["kitchen", "admin"]));
  res.json(staff);
});

adminRouter.post("/staff/invite", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, email, role } = req.body as { name: string; email: string; role: "kitchen" | "admin" };

  if (!name || !email || !role) {
    res.status(400).json({ error: "name, email and role are required" });
    return;
  }

  let supabaseId: string;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createError) {
    if (!createError.message.toLowerCase().includes("already")) {
      res.status(500).json({ error: createError.message });
      return;
    }
    // User already exists in Supabase — find their UUID
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);
    if (!existing) {
      res.status(500).json({ error: "Could not locate existing Supabase user" });
      return;
    }
    supabaseId = existing.id;
  } else {
    supabaseId = created.user.id;
  }

  const [row] = await db
    .insert(users)
    .values({ id: supabaseId, email, name, phone: null, role })
    .onConflictDoUpdate({ target: users.id, set: { name, email, role } })
    .returning();

  const loginUrl = `${process.env.WEB_URL ?? "https://salila-muha.vercel.app"}/login`;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@salilamuha.co.za",
    to: email,
    subject: "You have been added to Salila Muha",
    text: `Hi ${name},\n\nYou have been added to Salila Muha as ${role} staff.\n\nSign in here: ${loginUrl}\nEnter your email to receive a one-time passcode.\n\nSalila Muha`,
  }).catch((err) => console.error("Welcome email failed:", err));

  res.json(row);
});

adminRouter.patch("/staff/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role: "kitchen" | "admin" };

  if (!role) {
    res.status(400).json({ error: "role is required" });
    return;
  }

  const [row] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(row);
});

adminRouter.delete("/staff/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await db.delete(users).where(eq(users.id, id));
  res.json({ ok: true });
});
