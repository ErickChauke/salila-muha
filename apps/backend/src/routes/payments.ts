import { Router, urlencoded } from "express";
import type { OrderItem } from "@salila/types";
import * as paymentsService from "../services/payments.service";
import { optionalAuth } from "../middleware/auth";

export const paymentsRouter = Router();

paymentsRouter.post("/initiate", optionalAuth, async (req, res) => {
  const { customerName, customerPhone, items, total } = req.body as {
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    total: number;
  };

  if (!customerName || !items?.length || !total) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = await paymentsService.initiate({
    customerName,
    customerPhone: customerPhone ?? "",
    items,
    total,
    customerId: req.user?.id ?? null,
  });
  return res.json(result);
});

paymentsRouter.post("/notify", urlencoded({ extended: false }), async (req, res) => {
  await paymentsService.handleNotify(req.body as Record<string, string>);
  return res.sendStatus(200);
});
