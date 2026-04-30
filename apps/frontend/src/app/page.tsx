"use client";

import { useState } from "react";
import { useMenu } from "../hooks/useMenu";
import type { MenuItem } from "@salila/types";

const CATEGORIES: Array<{ key: MenuItem["category"]; label: string }> = [
  { key: "kota", label: "KOTA" },
  { key: "chips", label: "CHIPS" },
  { key: "extras", label: "EXTRAS" },
  { key: "drinks", label: "DRINKS" },
];

export default function HomePage() {
  const { items, loading } = useMenu();
  const [cart, setCart] = useState<Record<string, number>>({});

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function remove(id: string) {
    setCart((c) => {
      const qty = (c[id] ?? 0) - 1;
      if (qty <= 0) { const n = { ...c }; delete n[id]; return n; }
      return { ...c, [id]: qty };
    });
  }

  const cartItems = items.filter((i) => (cart[i.id] ?? 0) > 0);
  const cartCount = cartItems.reduce((s, i) => s + cart[i.id], 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * cart[i.id], 0);

  if (loading) {
    return (
      <main style={{ padding: 20, fontFamily: "var(--font-body)" }}>
        Loading menu...
      </main>
    );
  }

  return (
    <main style={{ paddingBottom: 100, fontFamily: "var(--font-body)" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1.5px solid var(--color-ink)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1 }}>
          Salila Muha
        </h1>
        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3, fontWeight: 700, letterSpacing: "0.1em" }}>
          BRAAMFONTEIN
        </p>
      </div>

      {CATEGORIES.map(({ key, label }) => {
        const section = items.filter((i) => i.category === key && i.available);
        if (!section.length) return null;
        return (
          <div key={key} style={{ padding: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0 8px" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "var(--color-primary-dark)" }}>
                {label}
              </span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px dashed var(--color-text-secondary)", opacity: 0.35 }} />
            </div>
            {section.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px dashed rgba(43,30,20,0.15)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  R{(item.price / 100).toFixed(0)}
                </span>
                {(cart[item.id] ?? 0) > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => remove(item.id)} style={{ width: 26, height: 26, borderRadius: 6, background: "var(--color-bg)", border: "1.5px solid var(--color-ink)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                    <span style={{ fontWeight: 800, fontSize: 13, minWidth: 14, textAlign: "center" }}>{cart[item.id]}</span>
                    <button onClick={() => add(item.id)} style={{ width: 26, height: 26, borderRadius: 6, background: "var(--color-primary)", border: "1.5px solid var(--color-ink)", cursor: "pointer", fontSize: 16, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => add(item.id)} style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-bg)", border: "1.5px solid var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", flexShrink: 0, boxShadow: "1px 1px 0 0 var(--color-ink)" }}>+</button>
                )}
              </div>
            ))}
          </div>
        );
      })}
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "var(--color-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1.5px solid var(--color-ink)" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", opacity: 0.7 }}>{cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginTop: 1 }}>R{(cartTotal / 100).toFixed(0)}</div>
          </div>
          <button style={{ background: "var(--color-primary)", border: "1.5px solid var(--color-primary-dark)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>
            CHECKOUT -&gt;
          </button>
        </div>
      )}
    </main>
  );
}
