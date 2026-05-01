"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import type { Order } from "@salila/types";

type Step = {
  label: string;
  done: boolean;
  active: boolean;
};

function buildSteps(status: Order["status"]): Step[] {
  const statusOrder = ["pending", "accepted", "preparing", "ready", "collected"] as const;
  const idx = statusOrder.indexOf(status as typeof statusOrder[number]);

  return [
    { label: "Order placed",        done: idx > 0, active: idx === 0 },
    { label: "Kitchen accepted",     done: idx > 1, active: idx === 1 },
    { label: "Preparing your kota",  done: idx > 2, active: idx === 2 },
    { label: "Ready for collection", done: idx > 3, active: idx === 3 },
    { label: "Collected",            done: idx >= 4, active: false },
  ];
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch<Order>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!order) return;

    const socket = io({ transports: ["polling"] });

    socket.on("order:updated", (event: { id: string; status: Order["status"]; updatedAt: string }) => {
      if (event.id === id) {
        setOrder((prev) => prev ? { ...prev, status: event.status, updatedAt: event.updatedAt } : prev);
      }
    });

    return () => { socket.disconnect(); };
  }, [id, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 8 }}>Order not found</div>
          <Link href="/" style={{ fontSize: 13, color: "var(--color-primary)" }}>Back to menu</Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)" }}>
        <div style={{ fontSize: 13, opacity: 0.6 }}>Loading order...</div>
      </main>
    );
  }

  const isRejected = order.status === "rejected";
  const steps = isRejected ? [] : buildSteps(order.status);
  const shortId = order.id.slice(-4).toUpperCase();
  const isOwner = user && order.customerId && user.id === order.customerId;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-bg)", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1.5px solid var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--color-ink)", textDecoration: "none", opacity: 0.6 }}>
          &larr; Menu
        </Link>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>ORDER #{shortId}</span>
        <span style={{ width: 48 }} />
      </div>

      <div style={{ padding: 16 }}>
        {isRejected ? (
          <div style={{ background: "#fff0f0", border: "1.5px solid #c0392b", borderRadius: 8, padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#c0392b", marginBottom: 6 }}>Order rejected</div>
            <div style={{ fontSize: 13, color: "var(--color-ink)", opacity: 0.7 }}>
              Sorry, we could not accept your order. Please place a new order or contact us.
            </div>
            <Link href="/" style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>
              Back to menu
            </Link>
          </div>
        ) : (
          <>
            {order.status !== "collected" && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-ink)", opacity: 0.5 }}>
                  {order.status === "ready" ? "READY FOR PICKUP" : "ORDER IN PROGRESS"}
                </div>
              </div>
            )}
            {order.status === "collected" && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--color-primary)" }}>Enjoy your kota!</div>
              </div>
            )}

            {/* T1 vertical timeline */}
            <div style={{ position: "relative", paddingLeft: 26, marginBottom: 20 }}>
              <div style={{ position: "absolute", left: 13, top: 10, bottom: 10, width: 2, background: "rgba(43,30,20,0.12)" }} />
              {steps.map((s, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: 20, display: "flex", gap: 12 }}>
                  <div style={{
                    position: "absolute",
                    left: -26,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: s.done ? "var(--color-primary)" : s.active ? "var(--color-primary)" : "var(--color-bg)",
                    border: "2px solid var(--color-ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: s.active ? "0 0 0 4px rgba(224,122,60,0.25)" : "none",
                    flexShrink: 0,
                  }}>
                    {s.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {s.active && !s.done && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ fontWeight: s.active ? 800 : 600, fontSize: 13, color: s.done || s.active ? "var(--color-ink)" : "rgba(43,30,20,0.4)" }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Collection info */}
            <div style={{ background: "#fff", border: "1.5px solid var(--color-ink)", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", opacity: 0.5, marginBottom: 4 }}>COLLECTION</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>35 de Korte St, Braamfontein</div>
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>Show order # at the window</div>
            </div>

            {/* Order summary */}
            <div style={{ background: "#fff", border: "1.5px solid var(--color-ink)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", opacity: 0.5, marginBottom: 8 }}>YOUR ORDER</div>
              {(order.items as Array<{ name: string; quantity: number; unitPrice: number }>).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 700 }}>R{((item.quantity * item.unitPrice) / 100).toFixed(0)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed rgba(43,30,20,0.2)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
                <span>Total</span>
                <span>R{(order.total / 100).toFixed(0)}</span>
              </div>
            </div>
          </>
        )}

        {isOwner && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>
              &larr; Back to menu
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
