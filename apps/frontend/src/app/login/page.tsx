"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { User } from "@salila/types";

const supabase = createSupabaseBrowserClient();

function roleRedirect(role: User["role"]) {
  return role === "admin" ? "/admin" : "/kitchen";
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (res.ok) {
        const user = (await res.json()) as User;
        router.replace(roleRedirect(user.role));
      }
    });
  }, [router]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (err) {
      setError("No account found for this email. Contact your admin.");
      return;
    }
    setStep("otp");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (err || !data.session) {
      setBusy(false);
      setError("Incorrect code. Check your email and try again.");
      return;
    }
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (!res.ok) {
      setBusy(false);
      setError("Account not authorised. Contact your admin.");
      return;
    }
    const user = (await res.json()) as User;
    router.replace(roleRedirect(user.role));
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          border: "1.5px solid var(--color-ink)",
          borderRadius: 4,
          padding: "32px 24px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            color: "var(--color-primary)",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          Salila Muha
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-ink)",
            textAlign: "center",
            opacity: 0.6,
            marginBottom: 28,
          }}
        >
          Staff sign in
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--color-ink)",
                  marginBottom: 6,
                }}
              >
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@salilamuha.co.za"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid var(--color-ink)",
                  borderRadius: 3,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  background: "var(--color-bg)",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#c0392b", fontFamily: "var(--font-body)", fontSize: 13, margin: 0 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "11px",
                background: busy ? "#ccc" : "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 14,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Sending..." : "Send me a code →"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--color-ink)",
                margin: 0,
              }}
            >
              Check <strong>{email}</strong> for your 6-digit code.
            </p>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--color-ink)",
                  marginBottom: 6,
                }}
              >
                CODE
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid var(--color-ink)",
                  borderRadius: 3,
                  fontFamily: "var(--font-body)",
                  fontSize: 22,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  background: "var(--color-bg)",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#c0392b", fontFamily: "var(--font-body)", fontSize: 13, margin: 0 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "11px",
                background: busy ? "#ccc" : "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 14,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Verifying..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--color-ink)",
                opacity: 0.6,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
