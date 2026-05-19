"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GuideRenderer } from "@/components/GuideRenderer";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(
    updatedAt ? new Date(updatedAt).toLocaleString() : null,
  );
  // Mobile-only view toggle; on desktop both panes show side by side.
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const dirty = title !== savedTitle || content !== savedContent;
  const sectionCount = (content.match(/^##\s+\S/gm) ?? []).length;

  // Insert a snippet at the cursor (replacing any selection), then restore
  // focus with the cursor placed just after the inserted text.
  function insertAtCursor(snippet: string, selectInside?: [number, number]) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    // Make sure headings/bullets start on their own line.
    const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
    const prefix = needsLeadingNewline ? "\n" : "";
    const next = before + prefix + snippet + after;
    setContent(next);
    setMobileView("edit");

    const caretBase = start + prefix.length;
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      if (selectInside) {
        node.setSelectionRange(
          caretBase + selectInside[0],
          caretBase + selectInside[1],
        );
      } else {
        const pos = caretBase + snippet.length;
        node.setSelectionRange(pos, pos);
      }
    });
  }

  function addHeading() {
    // Select the placeholder words so the user can type right over them.
    insertAtCursor("## New section\n", [3, 14]);
  }
  function addBullet() {
    insertAtCursor("- New item\n", [2, 10]);
  }

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
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {/* Header: title + status */}
      <div className="border-b border-zinc-100 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {slug === "waste" ? "Waste & Recycling Guide" : "Household Hazardous Waste"}
          </h2>
          {dirty ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Unsaved changes
            </span>
          ) : (
            <span className="text-xs text-zinc-400">
              {lastSaved ? `Saved ${lastSaved}` : "Not yet saved"}
            </span>
          )}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Page title residents see
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            maxLength={120}
          />
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-5 py-2.5">
        <span className="mr-1 text-xs font-medium text-zinc-500">Insert:</span>
        <button
          type="button"
          onClick={addHeading}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          <span className="font-bold">H</span> Section heading
        </button>
        <button
          type="button"
          onClick={addBullet}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          • Bullet point
        </button>
        <span className="ml-auto text-xs text-zinc-400">
          {sectionCount} section{sectionCount === 1 ? "" : "s"}
        </span>

        {/* Mobile edit/preview toggle */}
        <div className="ml-2 flex rounded-md ring-1 ring-zinc-200 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView("edit")}
            className={`rounded-l-md px-2.5 py-1 text-xs font-medium ${
              mobileView === "edit"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={`rounded-r-md px-2.5 py-1 text-xs font-medium ${
              mobileView === "preview"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor + live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Edit pane */}
        <div
          className={`border-zinc-100 p-5 lg:border-r ${
            mobileView === "edit" ? "block" : "hidden"
          } lg:block`}
        >
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Edit
          </div>
          <textarea
            ref={textareaRef}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing, or use the Insert buttons above to add a section heading or bullet."
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-[13px] leading-snug focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            maxLength={20000}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Lines starting with <code className="rounded bg-zinc-100 px-1">##</code>{" "}
            become section headings, lines starting with{" "}
            <code className="rounded bg-zinc-100 px-1">-</code> become bullets,
            everything else is a paragraph. The Insert buttons add these for you.
          </p>
        </div>

        {/* Preview pane */}
        <div
          className={`bg-zinc-50/40 p-5 ${
            mobileView === "preview" ? "block" : "hidden"
          } lg:block`}
        >
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Live preview — what residents see
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <h3 className="mb-3 text-lg font-semibold tracking-tight">
              {title || "Untitled guide"}
            </h3>
            {content.trim() ? (
              <GuideRenderer content={content} variant="light" />
            ) : (
              <p className="text-sm text-zinc-400">
                Nothing yet — start typing on the left.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 p-5">
        {error && (
          <div className="mr-auto rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
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
          className="rounded-lg bg-brand px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
