import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Order } from "@salila/types";
import { db } from "../db";
import { orders } from "../db/schema";
import { getIO } from "../lib/socket";

export async function getAll() {
  return db.select().from(orders).orderBy(orders.createdAt);
}

export async function getById(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return row ?? null;
}

export async function create(body: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "paidAt" | "paymentRef">) {
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
  getIO().to("kitchen").emit("order:new", order);
  return order;
}

export async function updateStatus(id: string, status: Order["status"]) {
  const updatedAt = new Date();
  await db.update(orders).set({ status, updatedAt }).where(eq(orders.id, id));
  getIO().to("kitchen").emit("order:updated", { id, status, updatedAt });
  return { id, status, updatedAt };
}
