"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_CATEGORIES } from "@/lib/format";
import { PhotoLightbox } from "./PhotoLightbox";
import { CameraCapture } from "./CameraCapture";

const STORAGE_KEY = "ts.reporter";
const MAX_PHOTOS = 3;

type Reporter = { name: string; contact: string };
type Preview = { file: File; url: string };

export function IssueForm({
  propertyId,
  successHref,
}: {
  propertyId: string;
  successHref: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reporter, setReporter] = useState<Reporter>({ name: "", contact: "" });
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [zoom, setZoom] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  // Held in a ref so the unmount cleanup can revoke whatever the latest
  // set of preview URLs is, without re-running on every previews change.
  const previewsRef = useRef<Preview[]>([]);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Hydrate remembered name/contact from localStorage on mount. Server
  // can't read localStorage so we start empty and fill in on the client —
  // standard hydration pattern; eslint flags it because the rule can't tell
  // it's a one-shot client-only sync.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Reporter;
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setReporter(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Revoke any remaining blob URLs on unmount only — not on every re-render,
  // which was killing the previous preview's <img src> as soon as a second
  // photo was added.
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  function addFiles(incoming: File[]) {
    if (!incoming || incoming.length === 0) return;
    setPreviews((prev) => {
      const slots = MAX_PHOTOS - prev.length;
      if (slots <= 0) return prev;
      const next: Preview[] = incoming.slice(0, slots).map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }));
      return [...prev, ...next];
    });
  }

  function removePreview(idx: number) {
    setPreviews((prev) => {
      const copy = [...prev];
      const [gone] = copy.splice(idx, 1);
      if (gone) URL.revokeObjectURL(gone.url);
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    fd.set("propertyId", propertyId);
    for (const p of previews) fd.append("photos", p.file);

    try {
      const res = await fetch("/api/issues", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Submission failed");
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reporter));
      } catch {
        /* ignore */
      }
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      router.push(successHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const slotsLeft = MAX_PHOTOS - previews.length;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Issue category">
        <select
          required
          name="category"
          defaultValue=""
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900"
        >
          <option value="" disabled>
            Pick one…
          </option>
          {ISSUE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Issue description" optional>
        <textarea
          name="description"
          rows={4}
          placeholder="What did you see?"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400"
        />
      </Field>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-700">
            Attach photos <span className="text-zinc-500">(up to 3)</span>
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              previews.length > 0 ? "text-brand-dark" : "text-zinc-500"
            }`}
          >
            {previews.length}/{MAX_PHOTOS}
          </span>
        </div>

        {previews.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div
                key={p.url}
                className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-zinc-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  onClick={() => setZoom(p.url)}
                  className="h-full w-full cursor-zoom-in object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={slotsLeft === 0}
            onClick={() => setCameraOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CameraIcon />
            <span>Take photo</span>
          </button>

          {/* Upload uses a directly-visible native input — most reliable
           * pattern across browsers. On iOS Safari the system shows
           * "Photo Library / Take Photo / Choose Files" automatically. */}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={slotsLeft === 0}
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
            className="block w-full cursor-pointer rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-zinc-200 file:bg-zinc-50 file:px-4 file:py-3 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Upload from camera roll or files"
          />
        </div>
      </div>

      <Field label="Your name">
        <input
          type="text"
          name="reporterName"
          required
          autoComplete="name"
          placeholder="Full name"
          value={reporter.name}
          onChange={(e) => setReporter((r) => ({ ...r, name: e.target.value }))}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400"
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          name="reporterContact"
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
        <span className="mt-1 block text-xs text-zinc-500">
          We&apos;ll use this to follow up with you if needed.
        </span>
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
        {submitting ? "Submitting…" : "Submit Report"}
      </button>

      {zoom && <PhotoLightbox src={zoom} onClose={() => setZoom(null)} />}
      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            addFiles([file]);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </form>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
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

