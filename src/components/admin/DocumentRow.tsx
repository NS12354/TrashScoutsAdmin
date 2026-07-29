"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DOCUMENT_CATEGORIES,
  fileKindLabel,
  formatFileSize,
} from "@/lib/documents";

export type AdminDocument = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  filename: string;
  size: number;
  uploadedByName: string | null;
  createdAt: string;
};

// Muted per-type badge colors so a long list is scannable at a glance.
const KIND_STYLES: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  Word: "bg-blue-50 text-blue-700",
  Excel: "bg-emerald-50 text-emerald-700",
  CSV: "bg-emerald-50 text-emerald-700",
  Slides: "bg-orange-50 text-orange-700",
  Image: "bg-violet-50 text-violet-700",
  Archive: "bg-zinc-100 text-zinc-600",
  Text: "bg-zinc-100 text-zinc-600",
};

export function DocumentRow({ doc }: { doc: AdminDocument }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [category, setCategory] = useState(doc.category);

  const kind = fileKindLabel(doc.filename);

  function cancelEdit() {
    setEditing(false);
    setError(null);
    setTitle(doc.title);
    setDescription(doc.description ?? "");
    setCategory(doc.category);
  }

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Delete “${doc.title}”? The file is removed for everyone and can't be recovered.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="space-y-3 bg-zinc-50/60 px-4 py-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full input"
          aria-label="Category"
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          className="w-full input"
        />
        <div className="text-xs text-zinc-400">
          Replacing the file itself means deleting this entry and uploading
          again.
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={busy}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="btn-primary"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
          KIND_STYLES[kind] ?? "bg-zinc-100 text-zinc-600"
        }`}
      >
        {kind}
      </span>

      <div className="min-w-0 flex-1">
        <div className="font-medium">{doc.title}</div>
        {doc.description && (
          <div className="text-sm text-zinc-500">{doc.description}</div>
        )}
        <div className="truncate text-xs text-zinc-400">
          {formatFileSize(doc.size)} ·{" "}
          {new Date(doc.createdAt).toLocaleDateString()}
          {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
        </div>
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* A plain link, not fetch(): lets the browser handle the save
            dialog and keeps the session cookie on the request. */}
        <a
          href={`/api/admin/documents/${doc.id}/download`}
          className="btn-sm"
          download
        >
          Download
        </a>
        <button type="button" onClick={() => setEditing(true)} className="btn-sm">
          Edit
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="btn-sm-danger"
        >
          {busy ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
