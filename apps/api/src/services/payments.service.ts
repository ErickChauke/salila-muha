import { eq } from "drizzle-orm";
import { db } from "../db";
import { orders } from "../db/schema";
import { getIO } from "../lib/socket";

interface ChargeParams {
  token: string;
  amountInCents: number;
  orderId: string;
}

export async function charge({ token, amountInCents, orderId }: ChargeParams) {
  const response = await fetch("https://online.yoco.com/v1/charges/", {
    method: "POST",
    headers: {
      "X-Auth-Secret-Key": process.env.YOCO_SECRET_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, amountInCents, currency: "ZAR" }),
  });

  const result = await response.json() as { id?: string; error?: { message: string } };

  if (!response.ok || result.error) {
    return { success: false as const, error: result.error?.message ?? "Payment failed" };
  }

  const updatedAt = new Date();
  await db
    .update(orders)
    .set({ status: "accepted", paymentRef: result.id, paidAt: new Date(), updatedAt })
    .where(eq(orders.id, orderId));

  getIO().to("kitchen").emit("order:updated", { id: orderId, status: "accepted", updatedAt });

  return { success: true as const, chargeId: result.id };
}
