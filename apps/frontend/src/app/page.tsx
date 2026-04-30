"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "../hooks/useMenu";
import { useAuth } from "../context/auth";
import type { MenuItem, OrderItem } from "@salila/types";
import { apiFetch } from "../lib/api";
import { PayFastCheckout } from "../components/payments/PayFastCheckout";

const CATEGORIES: Array<{ key: MenuItem["category"]; label: string }> = [
  { key: "kota", label: "KOTA" },
  { key: "chips", label: "CHIPS" },
  { key: "extras", label: "EXTRAS" },
  { key: "drinks", label: "DRINKS" },
];

export default function HomePage() {
  const router = useRouter();
  const { items, loading } = useMenu();
  const { user, session } = useAuth();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<MenuItem["category"]>("kota");
  const [step, setStep] = useState<"menu" | "form">("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyBySms, setNotifyBySms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("cart");
    if (saved) {
      try { setCart(JSON.parse(saved) as Record<string, number>); } catch { /* ignore */ }
      sessionStorage.removeItem("cart");
    }
  }, []);

  useEffect(() => {
    if (user && !name) setName(user.name);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleCheckout() {
    if (!user) {
      sessionStorage.setItem("cart", JSON.stringify(cart));
      router.push("/login?next=/");
      return;
    }
    setStep("form");
  }

  async function submitCash() {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          items: orderItems,
          total: cartTotal,
        }),
      }, session?.access_token);

      if (session?.access_token && phone.trim()) {
        apiFetch("/api/auth/me", {
          method: "PATCH",
          body: JSON.stringify({ phone: phone.trim(), notifyBySms }),
        }, session.access_token).catch(() => {});
      }

      router.push(`/track/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order.");
      setSubmitting(false);
    }
  }

  const visibleItems = items.filter((i) => i.category === activeCategory && i.available);

  if (loading) {
    return (
      <main style={{ padding: 20, fontFamily: "var(--font-body)" }}>
        Loading menu...
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "var(--font-body)", paddingBottom: 0 }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        borderBottom: "1.5px solid var(--color-ink)",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1 }}>
            Salila Muha
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-text-secondary)", marginTop: 3 }}>
            BRAAMFONTEIN
          </div>
        </div>
        <button
          onClick={() => user ? undefined : router.push("/login")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-ink)" }}
          aria-label={user ? user.name : "Sign in"}
        >
          {user ? (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", border: "1.5px solid var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="8" r="4" />
              <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Sticky category tabs */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5,
        display: "flex",
        background: "var(--color-bg)",
        borderBottom: "1.5px solid var(--color-ink)",
      }}>
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            style={{
              flex: 1, textAlign: "center", padding: "10px 0",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
              background: "none", border: "none", cursor: "pointer",
              color: activeCategory === key ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
              borderBottom: activeCategory === key ? "3px solid var(--color-primary)" : "3px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 2-column item grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        padding: "12px 12px 100px",
      }}>
        {visibleItems.map((item) => {
          const qty = cart[item.id] ?? 0;
          return (
            <div key={item.id} style={{
              border: "1.5px solid var(--color-ink)", borderRadius: 8,
              padding: 6, display: "flex", flexDirection: "column", gap: 6,
              background: "var(--color-bg)",
            }}>
              {/* Image area with floating +/qty control */}
              <div style={{ position: "relative" }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: 78, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(43,30,20,0.15)", display: "block" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 78, background: "var(--color-primary-soft)", borderRadius: 4, border: "1.5px dashed var(--color-primary-dark)" }} />
                )}
                {/* Floating add / qty control */}
                {qty === 0 ? (
                  <button
                    onClick={() => add(item.id)}
                    style={{
                      position: "absolute", bottom: -8, right: -8,
                      width: 26, height: 26, borderRadius: "50%",
                      background: "var(--color-primary)", border: "1.5px solid var(--color-ink)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "1.5px 1.5px 0 0 var(--color-ink)",
                      fontSize: 18, lineHeight: 1,
                    }}
                    aria-label={`Add ${item.name}`}
                  >
                    +
                  </button>
                ) : (
                  <div style={{
                    position: "absolute", bottom: -10, right: -6,
                    display: "flex", alignItems: "center", gap: 4,
                    background: "var(--color-bg)", border: "1.5px solid var(--color-ink)",
                    borderRadius: 999, padding: "2px 6px",
                    boxShadow: "1.5px 1.5px 0 0 var(--color-ink)",
                  }}>
                    <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "var(--color-ink)", padding: 0, width: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 12, minWidth: 12, textAlign: "center" }}>{qty}</span>
                    <button onClick={() => add(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "var(--color-primary-dark)", padding: 0, width: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ fontWeight: 800, fontSize: 11, marginTop: 6 }}>{item.name}</div>

              {/* Description */}
              {item.description && (
                <div style={{
                  fontSize: 9, color: "var(--color-text-secondary)", lineHeight: 1.25,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                  {item.description}
                </div>
              )}

              {/* Price */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <span style={{ fontWeight: 800, fontSize: 12 }}>R{(item.price / 100).toFixed(0)}</span>
              </div>
            </div>
          );
        })}
        {visibleItems.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>
            Nothing here yet.
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--color-ink)", color: "#fff",
          padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "2px solid var(--color-ink)",
        }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: "0.1em", fontWeight: 700 }}>
              CART · {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, marginTop: 1 }}>
              R{(cartTotal / 100).toFixed(0)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 4, height: 20, background: "var(--color-primary)" }} />
            <button
              onClick={handleCheckout}
              style={{
                background: "var(--color-primary)", border: "none",
                color: "#fff", fontWeight: 800, fontSize: 12,
                padding: "9px 16px", borderRadius: 8, cursor: "pointer",
              }}
            >
              CHECKOUT →
            </button>
          </div>
        </div>
      )}

      {/* Checkout bottom sheet */}
      {step === "form" && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,30,20,0.55)", display: "flex", alignItems: "flex-end", zIndex: 10 }}
          onClick={(e) => { if (e.target === e.currentTarget) setStep("menu"); }}
        >
          <div style={{ background: "var(--color-bg)", width: "100%", padding: "20px 16px 36px", borderRadius: "12px 12px 0 0", border: "1.5px solid var(--color-ink)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Your details</h2>
              <button onClick={() => setStep("menu")} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-ink)", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>NAME</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Thabo" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-ink)", borderRadius: 8, background: "var(--color-bg)", fontSize: 14, fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ marginBottom: phone.trim() ? 12 : 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                PHONE <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span>
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0821234567" type="tel" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--color-ink)", borderRadius: 8, background: "var(--color-bg)", fontSize: 14, fontFamily: "var(--font-body)" }} />
            </div>
            {phone.trim() && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={notifyBySms}
                  onChange={(e) => setNotifyBySms(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
                />
                <span style={{ fontSize: 13, fontFamily: "var(--font-body)" }}>
                  SMS me when my order is ready
                </span>
              </label>
            )}
            {error && <p style={{ color: "var(--color-late)", fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={submitCash} disabled={submitting} style={{ width: "100%", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "13px", borderRadius: 8, border: "1.5px solid var(--color-ink)", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Placing order..." : `ORDER + PAY AT COLLECTION — R${(cartTotal / 100).toFixed(0)}`}
              </button>
              <PayFastCheckout
                customerName={name.trim()}
                customerPhone={phone.trim()}
                items={orderItems}
                totalInCents={cartTotal}
                token={session?.access_token}
                onError={(msg) => { setError(msg); setSubmitting(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
