"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: "waste" | "hhw";
  initialTitle: string;
  initialContent: string;
  updatedAt: Date | string | null;
};

export function GuideEditor({
  slug,
  initialTitle,
  initialContent,
  updatedAt,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(
    updatedAt ? new Date(updatedAt).toLocaleString() : null,
  );

  const dirty = title !== savedTitle || content !== savedContent;
  const sectionCount = (content.match(/^##\s+\S/gm) ?? []).length;

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/guides/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      const { guide } = (await res.json()) as {
        guide: { title: string; content: string; updatedAt: string };
      };
      setSavedTitle(guide.title);
      setSavedContent(guide.content);
      setLastSaved(new Date(guide.updatedAt).toLocaleString());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function revert() {
    setTitle(savedTitle);
    setContent(savedContent);
    setError(null);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          slug: <span className="font-mono">{slug}</span>
        </div>
        <div className="text-xs text-zinc-500">
          {lastSaved ? `Last saved ${lastSaved}` : "Not yet saved"}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Title (shown to residents)
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          maxLength={120}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Content — markdown-lite ({sectionCount} section
          {sectionCount === 1 ? "" : "s"}, {content.length} chars)
        </span>
        <textarea
          rows={16}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-[13px] leading-snug"
          spellCheck={false}
          maxLength={20000}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Use <code className="rounded bg-zinc-100 px-1">## Heading</code> on
          its own line for a section, and{" "}
          <code className="rounded bg-zinc-100 px-1">- bullet</code> at the
          start of a line for a bullet point. Plain text becomes a paragraph.
        </p>
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {dirty && (
          <span className="mr-auto text-xs text-amber-700">
            Unsaved changes
          </span>
        )}
        <button
          type="button"
          onClick={revert}
          disabled={busy || !dirty}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
        >
          Revert
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
