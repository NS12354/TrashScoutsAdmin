"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPorterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setBusy(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        fd.append("subdir", "porters");
        const r = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        if (!r.ok) throw new Error("Photo upload failed");
        const j = await r.json();
        photoUrl = j.url;
      }
      const r2 = await fetch("/api/admin/porters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, photoUrl, email }),
      });
      if (!r2.ok) {
        const j = await r2.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      setName("");
      setTitle("");
      setEmail("");
      setPhoto(null);
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
      <div className="font-medium">Add a Porter</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full Name"
        className="w-full input"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Field Supervisor)"
        className="w-full input"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (gets issue reports for their properties)"
        className="w-full input"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
      />
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full btn-primary"
      >
        {busy ? "Saving…" : "Add Porter"}
      </button>
    </form>
  );
}
