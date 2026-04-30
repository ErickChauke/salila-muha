"use client";

import { useRouter } from "next/navigation";

export default function PayCancelledPage() {
  const router = useRouter();

  return (
    <main style={{ fontFamily: "var(--font-body)", maxWidth: 480, margin: "0 auto", padding: "40px 16px 48px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, marginBottom: 4 }}>Salila Muha</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 28 }}>
        BRAAMFONTEIN
      </div>
      <div style={{ padding: "20px 18px", background: "#fde8e8", border: "1.5px solid var(--color-late)", borderRadius: 10, marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--color-late)", lineHeight: 1, marginBottom: 8 }}>
          Payment cancelled
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Your order was not placed. No charge was made.
        </div>
      </div>
      <button
        onClick={() => router.push("/")}
        style={{ width: "100%", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "13px", borderRadius: 8, border: "1.5px solid var(--color-ink)", cursor: "pointer" }}
      >
        BACK TO MENU
      </button>
    </main>
  );
}
