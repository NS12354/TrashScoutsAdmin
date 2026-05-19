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
    sent: boolean;
    skipped: boolean;
    link?: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
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
      setNotice({
        email: data.user.email,
        sent: !!data.invite?.sent,
        skipped: !!data.invite?.skipped,
        link: data.invite?.link,
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

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="font-medium">Add an admin</div>
      <p className="text-xs text-zinc-500">
        We&apos;ll email them a link to choose their own password. They show
        up as <strong>Pending invite</strong> until they finish setup.
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
        <div
          className={`space-y-2 rounded-lg px-3 py-2 text-sm ring-1 ${
            notice.sent
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-amber-50 text-amber-900 ring-amber-200"
          }`}
        >
          <div>
            {notice.sent
              ? `Invite emailed to ${notice.email}.`
              : `Admin created — but the email didn't go out (Resend may be in sandbox mode, or the domain isn't verified). Copy the invite link below and share it with them manually.`}
          </div>
          {notice.link && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 min-w-0 break-all rounded bg-white/80 px-2 py-1 font-mono text-xs">
                {notice.link}
              </code>
              <button
                type="button"
                onClick={() => {
                  if (notice.link) navigator.clipboard?.writeText(notice.link);
                }}
                className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
