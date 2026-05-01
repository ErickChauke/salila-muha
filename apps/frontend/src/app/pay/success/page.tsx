"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  return (
    <main style={{ fontFamily: "var(--font-body)", maxWidth: 480, margin: "0 auto", padding: "40px 16px 48px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, marginBottom: 4 }}>Salila Muha</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 28 }}>
        BRAAMFONTEIN
      </div>
      <div style={{ padding: "20px 18px", background: "var(--color-primary-soft)", border: "1.5px solid var(--color-ink)", borderRadius: 10, marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--color-primary-dark)", lineHeight: 1, marginBottom: 8 }}>
          Payment received
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Your order is confirmed. The kitchen has been notified.
        </div>
      </div>
      {orderId && (
        <button
          onClick={() => router.push(`/track/${orderId}`)}
          style={{ width: "100%", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "13px", borderRadius: 8, border: "1.5px solid var(--color-ink)", cursor: "pointer" }}
        >
          TRACK YOUR ORDER
        </button>
      )}
    </main>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
