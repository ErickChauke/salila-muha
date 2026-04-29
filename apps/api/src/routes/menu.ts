import { Router } from "express";
import { db } from "../db";
import { menuItems } from "../schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const menuRouter = Router();

menuRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
  res.json(rows);
});

menuRouter.post("/", async (req, res) => {
  const item = { id: randomUUID(), ...req.body };
  await db.insert(menuItems).values(item);
  res.status(201).json(item);
});

menuRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  await db.update(menuItems).set(req.body).where(eq(menuItems.id, id));
  res.json({ id, ...req.body });
});

menuRouter.delete("/:id", async (req, res) => {
  await db.delete(menuItems).where(eq(menuItems.id, req.params.id));
  res.status(204).end();
});
