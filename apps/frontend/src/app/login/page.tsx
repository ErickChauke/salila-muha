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

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
  }

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
          Sign in
        </div>

        {/* Google sign-in for customers */}
        <button
          type="button"
          onClick={signInWithGoogle}
          style={{
            width: "100%",
            padding: "11px",
            background: "#fff",
            border: "1.5px solid var(--color-ink)",
            borderRadius: 3,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "16px 0 4px",
          }}
        >
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #ddd" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-ink)", opacity: 0.4 }}>
            or
          </span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #ddd" }} />
        </div>

        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-ink)",
            marginBottom: 12,
          }}
        >
          STAFF SIGN IN
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
