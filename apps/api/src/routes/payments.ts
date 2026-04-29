import { Router } from "express";
import { db } from "../db";
import { orders } from "../schema";
import { eq } from "drizzle-orm";
import { io } from "../index";

export const paymentsRouter = Router();

paymentsRouter.post("/charge", async (req, res) => {
  const { token, amountInCents, orderId } = req.body as {
    token: string;
    amountInCents: number;
    orderId: string;
  };

  const response = await fetch("https://online.yoco.com/v1/charges/", {
    method: "POST",
    headers: {
      "X-Auth-Secret-Key": process.env.YOCO_SECRET_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      amountInCents,
      currency: "ZAR",
    }),
  });

  const charge = await response.json() as { id?: string; error?: { message: string } };

  if (!response.ok || charge.error) {
    return res.status(402).json({ error: charge.error?.message ?? "Payment failed" });
  }

  const updatedAt = new Date();
  await db
    .update(orders)
    .set({ status: "accepted", paymentRef: charge.id, paidAt: new Date(), updatedAt })
    .where(eq(orders.id, orderId));

  io.to("kitchen").emit("order:updated", { id: orderId, status: "accepted", updatedAt });

  return res.json({ success: true, chargeId: charge.id });
});
