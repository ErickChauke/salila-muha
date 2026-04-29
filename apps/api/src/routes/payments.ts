import { Router } from "express";
import * as paymentsService from "../services/payments.service";

export const paymentsRouter = Router();

paymentsRouter.post("/charge", async (req, res) => {
  const { token, amountInCents, orderId } = req.body as {
    token: string;
    amountInCents: number;
    orderId: string;
  };

  const result = await paymentsService.charge({ token, amountInCents, orderId });

  if (!result.success) {
    return res.status(402).json({ error: result.error });
  }

  return res.json({ success: true, chargeId: result.chargeId });
});
