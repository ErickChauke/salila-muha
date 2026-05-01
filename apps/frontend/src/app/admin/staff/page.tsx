"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: "kitchen" | "admin";
}

export default function StaffPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"kitchen" | "admin">("kitchen");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<StaffMember[]>("/api/admin/staff", {}, token)
      .then(setStaff)
      .catch((e: Error) => setLoadError(e.message));
  }, [token]);

  async function changeRole(id: string, role: "kitchen" | "admin") {
    if (!token) return;
    try {
      const updated = await apiFetch<StaffMember>(
        `/api/admin/staff/${id}`,
        { method: "PATCH", body: JSON.stringify({ role }) },
        token
      );
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove(id: string, name: string) {
    if (!token) return;
    if (!confirm(`Remove ${name}? They will lose access immediately.`)) return;
    try {
      await apiFetch(`/api/admin/staff/${id}`, { method: "DELETE" }, token);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const member = await apiFetch<StaffMember>(
        "/api/admin/staff/invite",
        { method: "POST", body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole }) },
        token
      );
      setStaff((prev) => {
        const exists = prev.some((s) => s.id === member.id);
        return exists ? prev.map((s) => (s.id === member.id ? member : s)) : [...prev, member];
      });
      setInviteMsg({ ok: true, text: `Invite sent to ${inviteEmail}.` });
      setInviteName("");
      setInviteEmail("");
      setInviteRole("kitchen");
    } catch (err) {
      setInviteMsg({ ok: false, text: (err as Error).message });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "2rem" }}>
        Staff
      </h1>

      {/* Staff list */}
      {loadError ? (
        <p style={{ color: "red" }}>{loadError}</p>
      ) : staff.length === 0 ? (
        <p style={{ color: "var(--color-ink)", opacity: 0.6 }}>No staff members yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2.5rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--color-ink)" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #e5d9cc" }}>
                <td style={tdStyle}>{s.name}</td>
                <td style={tdStyle}>{s.email ?? "—"}</td>
                <td style={tdStyle}>
                  <select
                    value={s.role}
                    onChange={(ev) => changeRole(s.id, ev.target.value as "kitchen" | "admin")}
                    style={selectStyle}
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => remove(s.id, s.name)}
                    style={removeBtnStyle}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Invite form */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", marginBottom: "1rem" }}>
        Invite staff
      </h2>
      <form onSubmit={invite} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 400 }}>
        <input
          required
          placeholder="Name"
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
          style={inputStyle}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          style={inputStyle}
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as "kitchen" | "admin")}
          style={inputStyle}
        >
          <option value="kitchen">Kitchen</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={inviting} style={submitBtnStyle}>
          {inviting ? "Sending…" : "Send invite"}
        </button>
        {inviteMsg && (
          <p style={{ color: inviteMsg.ok ? "green" : "red", margin: 0 }}>{inviteMsg.text}</p>
        )}
      </form>

      <p style={{ marginTop: "2rem", fontSize: "0.875rem", opacity: 0.6 }}>
        Removed staff lose access immediately. They receive no notification.
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "0.5rem 0.75rem", fontFamily: "var(--font-body)" };
const tdStyle: React.CSSProperties = { padding: "0.6rem 0.75rem", fontFamily: "var(--font-body)" };
const selectStyle: React.CSSProperties = {
  padding: "0.25rem 0.5rem",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontFamily: "var(--font-body)",
};
const inputStyle: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
};
const submitBtnStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  cursor: "pointer",
};
const removeBtnStyle: React.CSSProperties = {
  padding: "0.25rem 0.75rem",
  background: "transparent",
  border: "1px solid #c00",
  color: "#c00",
  borderRadius: 4,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
};
