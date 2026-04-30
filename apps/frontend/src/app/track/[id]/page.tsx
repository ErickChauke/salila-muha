"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Order, OrderStatus } from "@salila/types";
import { apiFetch } from "../../../lib/api";
import { socket } from "../../../lib/socket";

const STEPS: Array<{ status: OrderStatus; label: string; icon: string }> = [
  { status: "pending",    label: "Order placed",          icon: "🧾" },
  { status: "accepted",   label: "Kitchen accepted",       icon: "👨‍🍳" },
  { status: "preparing",  label: "Preparing your order",   icon: "🔥" },
  { status: "ready",      label: "Ready for collection",   icon: "🛍️" },
  { status: "collected",  label: "Collected - enjoy!",     icon: "✅" },
];

const STATUS_ORDER: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "collected"];

function stepIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status);
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch<Order>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => setNotFound(true));

    socket.connect();
    socket.on("order:updated", ({ id: uid, status }: Pick<Order, "id" | "status" | "updatedAt">) => {
      if (uid === id) setOrder((o) => o ? { ...o, status } : o);
    });
    return () => { socket.off("order:updated"); socket.disconnect(); };
  }, [id]);

  if (notFound) {
    return (
      <main style={{ padding: 24, fontFamily: "var(--font-body)" }}>
        <p style={{ color: "var(--color-late)", fontWeight: 700 }}>Order not found.</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: 24, fontFamily: "var(--font-body)" }}>
        Loading order...
      </main>
    );
  }

  const isRejected = order.status === "rejected";
  const currentIdx = stepIndex(order.status);

  return (
    <main style={{ fontFamily: "var(--font-body)", maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1 }}>Salila Muha</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginTop: 3 }}>
          ORDER #{id.slice(0, 8).toUpperCase()}
        </div>
      </div>

      {isRejected ? (
        <div style={{ padding: "16px", background: "#fde8e8", border: "1.5px solid var(--color-late)", borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, color: "var(--color-late)", fontSize: 15 }}>Order rejected</div>
          <div style={{ fontSize: 13, marginTop: 4, color: "var(--color-ink)" }}>Please call the shop or place a new order.</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: 24, padding: "16px", background: "var(--color-primary-soft)", border: "1.5px solid var(--color-ink)", borderRadius: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1, color: "var(--color-primary-dark)" }}>
            {order.status === "ready" || order.status === "collected" ? "Ready!" : "In progress"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginTop: 4 }}>
            {order.status === "ready" ? "HEAD TO THE WINDOW" : order.status === "collected" ? "ENJOY YOUR KOTA" : "WE'LL LET YOU KNOW WHEN READY"}
          </div>
        </div>
      )}

      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 11, top: 14, bottom: 14, width: 2, background: "rgba(43,30,20,0.12)" }} />
        {STEPS.map((step, i) => {
          const done = !isRejected && i < currentIdx;
          const active = !isRejected && i === currentIdx;
          return (
            <div key={step.status} style={{ position: "relative", paddingBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                position: "absolute", left: -28, width: 24, height: 24, borderRadius: "50%",
                background: done ? "var(--color-ready)" : active ? "var(--color-primary)" : "var(--color-bg)",
                border: `2px solid ${done ? "var(--color-ready)" : active ? "var(--color-primary)" : "rgba(43,30,20,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                boxShadow: active ? "0 0 0 4px rgba(224,122,60,0.2)" : "none",
              }}>
                {done ? "✓" : step.icon}
              </div>
              <div>
                <div style={{ fontWeight: active ? 800 : 600, fontSize: 13, color: done || active ? "var(--color-ink)" : "rgba(43,30,20,0.4)" }}>
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8, padding: "12px 14px", border: "1.5px solid var(--color-ink)", borderRadius: 8, background: "var(--color-bg)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 6 }}>YOUR ORDER</div>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", borderBottom: "1px dashed rgba(43,30,20,0.12)" }}>
            <span>{item.quantity}x {item.name}</span>
            <span style={{ fontWeight: 700 }}>R{((item.unitPrice * item.quantity) / 100).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, marginTop: 8 }}>
          <span>Total</span>
          <span>R{(order.total / 100).toFixed(0)}</span>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center" }}>
        35 de Korte St, Braamfontein - show order # at the window
      </div>
    </main>
  );
}
