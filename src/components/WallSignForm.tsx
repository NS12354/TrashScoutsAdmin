"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "ts.reporter";

type Reporter = { name: string; contact: string; phone: string };

export function WallSignForm({
  propertyId,
  successHref,
}: {
  propertyId: string;
  successHref: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporter, setReporter] = useState<Reporter>({
    name: "",
    contact: "",
    phone: "",
  });
  const [notes, setNotes] = useState("");

  // Reuse the same localStorage key as IssueForm — residents who've
  // already filled it out for an issue report shouldn't have to retype.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Reporter>;
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setReporter({
            name: parsed.name ?? "",
            contact: parsed.contact ?? "",
            phone: parsed.phone ?? "",
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("propertyId", propertyId);
    fd.set("requesterName", reporter.name.trim());
    fd.set("requesterContact", reporter.contact.trim());
    fd.set("notes", notes.trim());
    try {
      const res = await fetch("/api/wall-sign", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Submission failed");
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reporter));
      } catch {
        /* ignore */
      }
      router.push(successHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 ring-1 ring-zinc-200">
        Trash Scouts Enclosure Wall Signs help residents sort waste
        correctly at the bin. Submit your details below and we&apos;ll
        follow up.
      </p>

      <Field label="Your Name">
        <input
          type="text"
          required
          autoComplete="name"
          placeholder="Full name"
          value={reporter.name}
          onChange={(e) =>
            setReporter((r) => ({ ...r, name: e.target.value }))
          }
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400"
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="email@example.com"
          value={reporter.contact}
          onChange={(e) =>
            setReporter((r) => ({ ...r, contact: e.target.value }))
          }
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400"
        />
      </Field>

      <Field label="Anything we should know?" optional>
        <textarea
          rows={3}
          placeholder="Unit number, mounting preference, language, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400"
        />
      </Field>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Send Request"}
      </button>
    </form>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}{" "}
        {optional && <span className="text-zinc-500">(optional)</span>}
      </span>
      {children}
    </label>
  );
}
