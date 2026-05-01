"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "../../context/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

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
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
          <Link
            href="/admin/staff"
            style={{ color: "inherit", textDecoration: "none", fontFamily: "var(--font-body)" }}
          >
            Staff
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "inherit",
            borderRadius: 6,
            padding: "0.5rem 0.75rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Log out
        </button>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
