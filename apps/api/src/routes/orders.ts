import { Router } from "express";
import { db } from "../db";
import { orders } from "../schema";
import { eq } from "drizzle-orm";
import { io } from "../index";
import type { Order } from "@salila/types";
import { randomUUID } from "crypto";

export const ordersRouter = Router();

ordersRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(orders).orderBy(orders.createdAt);
  res.json(rows);
});

ordersRouter.post("/", async (req, res) => {
  const body = req.body as Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "paidAt" | "paymentRef">;
  const now = new Date();
  const order = {
    id: randomUUID(),
    ...body,
    status: "pending" as const,
    paymentRef: null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(orders).values(order);
  io.to("kitchen").emit("order:new", order);
  res.status(201).json(order);
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: Order["status"] };
  const updatedAt = new Date();

  await db.update(orders).set({ status, updatedAt }).where(eq(orders.id, id));
  io.to("kitchen").emit("order:updated", { id, status, updatedAt });
  res.json({ id, status, updatedAt });
});
