"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = name.trim() !== initialName;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="font-medium">Profile</div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Name
        </span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className="w-full input"
          maxLength={100}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Email
        </span>
        <input
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Email can&apos;t be changed here. Ask another admin to invite a new
          account if you need a different login.
        </span>
      </label>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {saved && !dirty && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Profile saved.
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="btn-primary"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
