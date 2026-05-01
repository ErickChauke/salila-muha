"use client";

import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@salila/types";
import { useAuth } from "../../context/auth";
import { useOrders } from "../../hooks/useOrders";
import { apiFetch } from "../../lib/api";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function OrderCard({
  order,
  onAction,
}: {
  order: Order;
  onAction: (id: string, status: OrderStatus) => void;
}) {
  const age = minutesAgo(order.createdAt);
  const isLate = age > 15 && order.status !== "ready";
  const shortId = order.id.slice(-4).toUpperCase();
  const accentColor =
    order.status === "pending"
      ? "var(--color-primary)"
      : order.status === "ready"
      ? "#4a7c3f"
      : "#c8940a";

  return (
    <div
      style={{
        border: "1.5px solid var(--color-ink)",
        borderLeft: `5px solid ${accentColor}`,
        borderRadius: 6,
        background: "#fff",
        padding: "8px 10px",
        boxShadow: isLate
          ? "0 0 0 2px #c0392b"
          : "1.5px 1.5px 0 0 rgba(43,30,20,0.12)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontWeight: 900, fontSize: 13 }}>#{shortId}</span>
          {isLate && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                background: "#c0392b",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 999,
              }}
            >
              LATE
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: isLate ? "#c0392b" : "rgba(43,30,20,0.5)" }}>
          {age}m
        </span>
      </div>

      <div style={{ fontSize: 10, color: "rgba(43,30,20,0.7)", lineHeight: 1.4, marginBottom: 4 }}>
        {(order.items as Array<{ name: string; quantity: number; unitPrice: number }>).map(
          (item, i) => (
            <div key={i}>
              • {item.quantity}x {item.name}
            </div>
          )
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
        <span style={{ color: "rgba(43,30,20,0.6)" }}>{order.customerName}</span>
        <span style={{ fontWeight: 800 }}>R{(order.total / 100).toFixed(0)}</span>
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {order.status === "pending" && (
          <>
            <button onClick={() => onAction(order.id, "accepted")} style={actionBtn("#4a7c3f", "#fff")}>
              ACCEPT
            </button>
            <button onClick={() => onAction(order.id, "rejected")} style={actionBtn("transparent", "var(--color-ink)", true)}>
              REJECT
            </button>
          </>
        )}
        {(order.status === "accepted" || order.status === "preparing") && (
          <button
            onClick={() => onAction(order.id, "ready")}
            style={{ ...actionBtn("var(--color-ink)", "var(--color-bg)"), flex: 1 }}
          >
            MARK READY
          </button>
        )}
        {order.status === "ready" && (
          <button
            onClick={() => onAction(order.id, "collected")}
            style={{ ...actionBtn("var(--color-ink)", "var(--color-bg)"), flex: 1 }}
          >
            COLLECTED
          </button>
        )}
      </div>
    </div>
  );
}

function actionBtn(bg: string, color: string, ghost = false): React.CSSProperties {
  return {
    flex: 1,
    padding: "4px 6px",
    background: bg,
    color,
    border: ghost ? "1.5px solid var(--color-ink)" : "1.5px solid transparent",
    borderRadius: 4,
    fontFamily: "var(--font-body)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.05em",
    cursor: "pointer",
  };
}

const COLUMNS: { label: string; statuses: OrderStatus[]; color: string }[] = [
  { label: "NEW", statuses: ["pending"], color: "var(--color-primary)" },
  { label: "PREPARING", statuses: ["accepted", "preparing"], color: "#c8940a" },
  { label: "READY", statuses: ["ready"], color: "#4a7c3f" },
];

export default function KitchenPage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const token = session?.access_token;
  const { orders, setOrders } = useOrders(token);

  const visible = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const todayCount = orders.filter((o) => isToday(o.createdAt)).length;

  async function handleAction(id: string, status: OrderStatus) {
    try {
      await apiFetch(
        `/api/orders/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        token
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        fontFamily: "var(--font-body)",
        color: "var(--color-ink)",
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          padding: "10px 20px",
          background: "var(--color-ink)",
          color: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-display)",
            }}
          >
            SALILA MUHA · KITCHEN
          </span>
          <span
            style={{
              background: "#4a7c3f",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 999,
              letterSpacing: "0.05em",
            }}
          >
            LIVE
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, alignItems: "center" }}>
          <span>
            Today: <b>{todayCount}</b> order{todayCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "var(--color-bg)",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 11,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          padding: 14,
          background: "var(--color-bg)",
          overflow: "hidden",
        }}
      >
        {COLUMNS.map((col) => {
          const colOrders = visible.filter((o) => col.statuses.includes(o.status));
          return (
            <div
              key={col.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#fdf6ed",
                border: "1.5px solid var(--color-ink)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1.5px solid var(--color-ink)",
                  background: col.color,
                  color: col.label === "PREPARING" ? "var(--color-ink)" : "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: "0.08em" }}>
                  {col.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    background: "rgba(0,0,0,0.15)",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {colOrders.length}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                }}
              >
                {colOrders.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      fontSize: 10,
                      color: "rgba(43,30,20,0.4)",
                      fontStyle: "italic",
                    }}
                  >
                    No orders here.
                  </div>
                ) : (
                  colOrders.map((o) => (
                    <OrderCard key={o.id} order={o} onAction={handleAction} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
