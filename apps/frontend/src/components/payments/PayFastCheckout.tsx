"use client";

import { useState } from "react";
import type { OrderItem } from "@salila/types";

interface Props {
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalInCents: number;
  onError: (message: string) => void;
}

export function PayFastCheckout({ customerName, customerPhone, items, totalInCents, onError }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (!customerName.trim() || !customerPhone.trim()) {
      onError("Name and phone are required.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerPhone, items, total: totalInCents }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json() as { error?: string };
      onError(data.error ?? "Failed to initiate payment.");
      return;
    }

    const { action, fields } = await res.json() as { action: string; fields: Record<string, string> };

    const form = document.createElement("form");
    form.method = "post";
    form.action = action;
    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      style={{ width: "100%", background: "var(--color-primary)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "13px", borderRadius: 8, border: "1.5px solid var(--color-primary-dark)", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "Redirecting to PayFast..." : `PAY BY CARD - R${(totalInCents / 100).toFixed(0)}`}
    </button>
  );
}
