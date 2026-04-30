"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "../hooks/useMenu";
import type { MenuItem, OrderItem } from "@salila/types";
import { apiFetch } from "../lib/api";
import { YocoCheckout } from "../components/payments/YocoCheckout";

const CATEGORIES: Array<{ key: MenuItem["category"]; label: string }> = [
  { key: "kota", label: "KOTA" },
  { key: "chips", label: "CHIPS" },
  { key: "extras", label: "EXTRAS" },
  { key: "drinks", label: "DRINKS" },
];

export default function HomePage() {
  const router = useRouter();
  const { items, loading } = useMenu();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"menu" | "form">("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const orderItems: OrderItem[] = cartItems.map((i) => ({
    menuItemId: i.id, name: i.name, quantity: cart[i.id], unitPrice: i.price, notes: null,
  }));

  async function submitCash() {
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ customerName: name.trim(), customerPhone: phone.trim(), items: orderItems, total: cartTotal }),
      });
      router.push(`/track/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order.");
      setSubmitting(false);
    }
  }

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
          <button onClick={() => setStep("form")} style={{ background: "var(--color-primary)", border: "1.5px solid var(--color-primary-dark)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>
            CHECKOUT -&gt;
          </button>
        </div>
      )}

      {step === "form" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(43,30,20,0.55)", display: "flex", alignItems: "flex-end", zIndex: 10 }} onClick={(e) => { if (e.target === e.currentTarget) setStep("menu"); }}>
          <div style={{ background: "var(--color-bg)", width: "100%", padding: "20px 16px 36px", borderRadius: "12px 12px 0 0", border: "1.5px solid var(--color-ink)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Your details</h2>
              <button onClick={() => setStep("menu")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-ink)" }}>x</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>NAME</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Thabo" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-ink)", borderRadius: 8, background: "var(--color-bg)", fontSize: 14, fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>PHONE</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0821234567" type="tel" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-ink)", borderRadius: 8, background: "var(--color-bg)", fontSize: 14, fontFamily: "var(--font-body)" }} />
            </div>
            {error && <p style={{ color: "var(--color-late)", fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={submitCash} disabled={submitting} style={{ width: "100%", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "13px", borderRadius: 8, border: "1.5px solid var(--color-ink)", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Placing order..." : `ORDER + PAY AT COLLECTION - R${(cartTotal / 100).toFixed(0)}`}
              </button>
              <YocoCheckout
                customerName={name.trim()}
                customerPhone={phone.trim()}
                items={orderItems}
                totalInCents={cartTotal}
                onSuccess={(id) => router.push(`/track/${id}`)}
                onError={(msg) => { setError(msg); setSubmitting(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
