"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetPasswordForm({
  token,
  email,
  name,
  purpose,
}: {
  token: string;
  email: string;
  name: string;
  purpose: "invite" | "reset";
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not set password");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {purpose === "invite" ? "Welcome" : "Reset password for"}
        </div>
        <div className="mt-0.5 font-medium">{name}</div>
        <div className="text-zinc-500">{email}</div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">New password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full input"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Must be at least 8 characters.
        </span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Confirm password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full input"
        />
      </label>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full btn-primary"
      >
        {busy
          ? "Saving…"
          : purpose === "invite"
            ? "Set password and sign in"
            : "Update password and sign in"}
      </button>
    </form>
  );
}
