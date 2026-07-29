"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  DEFAULT_CATEGORY,
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  formatFileSize,
  isAllowedDocument,
} from "@/lib/documents";

type Meta = { title: string; description: string; category: string };

// Ask the server how to upload, then do it. In production it hands back a
// signed URL and the file goes browser → Supabase, never passing through a
// serverless function (whose request body is capped well below our limit).
// With no object storage configured it says "server" and we post the file
// the ordinary way.
async function upload(file: File, meta: Meta): Promise<void> {
  const ticketRes = await fetch("/api/admin/documents/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, size: file.size }),
  });
  if (!ticketRes.ok) {
    const j = await ticketRes.json().catch(() => ({}));
    throw new Error(j.error || "Upload failed");
  }
  const ticket = (await ticketRes.json()) as {
    mode: "direct" | "server";
    key?: string;
    signedUrl?: string;
  };

  if (ticket.mode === "server") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", meta.title);
    fd.append("description", meta.description);
    fd.append("category", meta.category);
    const res = await fetch("/api/admin/documents", { method: "POST", body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Upload failed");
    }
    return;
  }

  const put = await fetch(ticket.signedUrl!, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed — check your connection");

  // The bytes are in storage but nothing references them until this
  // succeeds; a failure here leaves an orphaned object, not a broken row.
  const res = await fetch("/api/admin/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storageKey: ticket.key,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      ...meta,
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Upload failed");
  }
}

export function DocumentUploadForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(next: File | null) {
    setError(null);
    setFile(next);
    // Prefill the title from the filename (minus extension) so the common
    // case is choose-file-then-upload with no typing.
    if (next && !title.trim()) {
      setTitle(next.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a file to upload");
      return;
    }
    if (!isAllowedDocument(file.name)) {
      setError("That file type isn't supported");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`File must be under ${formatFileSize(MAX_DOCUMENT_BYTES)}`);
      return;
    }

    setBusy(true);
    try {
      await upload(file, { title, description, category });
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory(DEFAULT_CATEGORY);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="h-fit space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="font-medium">Upload a document</div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
      />
      {file && (
        <div className="truncate text-xs text-zinc-500">
          {file.name} · {formatFileSize(file.size)}
        </div>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Bin Pull-Out Procedure)"
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

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={busy} className="w-full btn-primary">
        {busy ? "Uploading…" : "Upload"}
      </button>

      <p className="text-xs text-zinc-400">
        PDF, Word, Excel, Slides, images and zips up to{" "}
        {formatFileSize(MAX_DOCUMENT_BYTES)}. Everyone with an admin login can
        download what you upload here.
      </p>
    </form>
  );
}
