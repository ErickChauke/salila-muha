"use client";

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
                <button
                  style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-bg)", border: "1.5px solid var(--color-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", flexShrink: 0, boxShadow: "1px 1px 0 0 var(--color-ink)" }}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </main>
  );
}
