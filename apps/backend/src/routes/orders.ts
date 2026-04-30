import { Router } from "express";
import type { Order } from "@salila/types";
import * as ordersService from "../services/orders.service";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth";

export const ordersRouter = Router();

ordersRouter.get("/", async (_req, res) => {
  const rows = await ordersService.getAll();
  res.json(rows);
});

ordersRouter.get("/:id", async (req, res) => {
  const order = await ordersService.getById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

ordersRouter.post("/", optionalAuth, async (req, res) => {
  const body = req.body as Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "paidAt" | "paymentRef">;
  const order = await ordersService.create({
    ...body,
    customerId: req.user?.id ?? null,
  });
  res.status(201).json(order);
});

ordersRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("kitchen", "admin"),
  async (req, res) => {
    const result = await ordersService.updateStatus(req.params.id, req.body.status);
    res.json(result);
  }
);
