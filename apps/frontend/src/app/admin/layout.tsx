import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "var(--color-ink)",
          color: "var(--color-bg)",
          padding: "2rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            color: "var(--color-primary)",
          }}
        >
          Salila Muha
        </span>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link
            href="/admin/staff"
            style={{ color: "inherit", textDecoration: "none", fontFamily: "var(--font-body)" }}
          >
            Staff
          </Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
