import { Router } from "express";
import type { Order } from "@salila/types";
import * as ordersService from "../services/orders.service";

export const ordersRouter = Router();

ordersRouter.get("/", async (_req, res) => {
  const rows = await ordersService.getAll();
  res.json(rows);
});

ordersRouter.post("/", async (req, res) => {
  const order = await ordersService.create(
    req.body as Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "paidAt" | "paymentRef">
  );
  res.status(201).json(order);
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const result = await ordersService.updateStatus(req.params.id, req.body.status);
  res.json(result);
});
