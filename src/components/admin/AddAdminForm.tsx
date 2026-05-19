"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddAdminForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    email: string;
    name: string;
    link: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setCopied(false);
    if (!email.trim() || !name.trim()) {
      setError("Email and name are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not add admin");
      }
      const data = await res.json();
      if (!data.invite?.link) {
        throw new Error("Server didn't return an invite link");
      }
      setNotice({
        email: data.user.email,
        name: data.user.name,
        link: data.invite.link,
      });
      setEmail("");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add admin");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!notice?.link) return;
    try {
      await navigator.clipboard.writeText(notice.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* user can still select the text manually */
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="font-medium">Add an admin</div>
      <p className="text-xs text-zinc-500">
        Add their email and name. We&apos;ll give you a one-time setup link to
        share with them however you like (Slack, text, email). They&apos;ll set
        their own password on first visit.
      </p>
      <input
        type="email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@trashscouts.com"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <div>
            <strong>{notice.name}</strong> added. Send this link to{" "}
            <strong>{notice.email}</strong> — it expires in 7 days and can only
            be used once.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded bg-white/80 px-2 py-1 font-mono text-xs">
              {notice.link}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create admin + get link"}
      </button>
    </form>
  );
}
