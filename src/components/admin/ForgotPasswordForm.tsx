"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      /* ignore — endpoint always returns success */
    } finally {
      setSubmitted(true);
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200">
        If that email belongs to an admin account, a reset link is on the way.
        Check your inbox (and spam folder).
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
