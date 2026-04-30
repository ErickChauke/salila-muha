import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { OrderItem } from "@salila/types";
import { db } from "../db";
import { orders } from "../db/schema";
import { getIO } from "../lib/socket";
import * as ordersService from "./orders.service";

interface InitiateParams {
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
}

const PAYFAST_URL = process.env.PAYFAST_SANDBOX === "true"
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

function buildSignature(params: Record<string, string>, passphrase?: string): string {
  const str = Object.entries(params)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
  const final = passphrase
    ? `${str}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : str;
  return crypto.createHash("md5").update(final).digest("hex");
}

export async function initiate({ customerName, customerPhone, items, total }: InitiateParams) {
  const order = await ordersService.create({ customerName, customerPhone, items, total, customerId: null });

  const frontendUrl = process.env.FRONTEND_URL ?? "https://salila-muha.vercel.app";
  const backendUrl = process.env.BACKEND_URL ?? "http://13.244.64.123";

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${frontendUrl}/pay/success?order_id=${order.id}`,
    cancel_url: `${frontendUrl}/pay/cancelled`,
    notify_url: `${backendUrl}/api/payments/notify`,
    name_first: customerName,
    amount: (total / 100).toFixed(2),
    item_name: "Salila Muha Order",
    custom_str1: order.id,
  };

  const signature = buildSignature(params, process.env.PAYFAST_PASSPHRASE);

  return { action: PAYFAST_URL, fields: { ...params, signature } };
}

export async function handleNotify(body: Record<string, string>) {
  const { signature, ...rest } = body;

  const expected = buildSignature(rest, process.env.PAYFAST_PASSPHRASE);
  if (expected !== signature) {
    console.error("[PayFast] ITN signature mismatch");
    return;
  }

  const orderId = rest.custom_str1;
  if (!orderId) {
    console.error("[PayFast] ITN missing custom_str1");
    return;
  }

  const updatedAt = new Date();
  await db
    .update(orders)
    .set({ status: "accepted", paymentRef: rest.pf_payment_id ?? null, paidAt: updatedAt, updatedAt })
    .where(eq(orders.id, orderId));

  getIO().to("kitchen").emit("order:updated", { id: orderId, status: "accepted", updatedAt });
}
