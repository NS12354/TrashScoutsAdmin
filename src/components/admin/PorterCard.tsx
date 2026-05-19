"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Porter = {
  id: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
  propertyCount: number;
};

export function PorterCard({ porter }: { porter: Porter }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(porter.name);
  const [title, setTitle] = useState(porter.title ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  function cancelEdit() {
    setEditing(false);
    setError(null);
    setName(porter.name);
    setTitle(porter.title ?? "");
    setPhotoFile(null);
    setRemovePhoto(false);
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("subdir", "porters");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const j = (await res.json()) as { url?: string };
    return j.url ?? null;
  }

  async function save() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        title: title.trim(),
      };
      if (photoFile) {
        const url = await uploadPhoto(photoFile);
        if (!url) throw new Error("Photo upload failed");
        body.photoUrl = url;
      } else if (removePhoto) {
        body.photoUrl = null;
      }
      const res = await fetch(`/api/admin/porters/${porter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      setEditing(false);
      setPhotoFile(null);
      setRemovePhoto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const note =
      porter.propertyCount > 0
        ? ` ${porter.propertyCount} propert${porter.propertyCount === 1 ? "y" : "ies"} currently assigned to this porter will be left without one.`
        : "";
    const ok = window.confirm(`Delete porter “${porter.name}”?${note}`);
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/porters/${porter.id}`, {
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

  if (!editing) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100">
          {porter.photoUrl ? (
            <Image
              src={porter.photoUrl}
              alt={porter.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-semibold text-zinc-400">
              {porter.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{porter.name}</div>
          {porter.title && (
            <div className="truncate text-sm text-zinc-500">{porter.title}</div>
          )}
          <div className="text-xs text-zinc-400">
            {porter.propertyCount} propert
            {porter.propertyCount === 1 ? "y" : "ies"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
          >
            {busy ? "…" : "Delete"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-3 bg-zinc-50/60 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100">
          {porter.photoUrl && !removePhoto ? (
            <Image
              src={porter.photoUrl}
              alt={porter.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-semibold text-zinc-400">
              {(name || porter.name).charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Field Supervisor since 2020)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setPhotoFile(e.target.files?.[0] ?? null);
              setRemovePhoto(false);
            }}
            className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-zinc-200"
          />
          {porter.photoUrl && !photoFile && (
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={removePhoto}
                onChange={(e) => setRemovePhoto(e.target.checked)}
              />
              Remove current photo
            </label>
          )}
        </div>
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
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </li>
  );
}
