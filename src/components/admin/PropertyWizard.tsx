"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DAY_NAMES } from "@/lib/format";

const BIN_TYPES = ["TRASH", "RECYCLING", "ORGANICS", "OTHER"] as const;
const ACTIONS = ["PULL_OUT", "RETURN"] as const;

// Time-of-day options in 30-minute increments (12-hour labels).
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      out.push(`${hour12}:${m === 0 ? "00" : "30"} ${ampm}`);
    }
  }
  return out;
})();

type Porter = {
  id: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
};

type ScheduleRow = {
  key: string;
  dayOfWeek: number;
  binType: (typeof BIN_TYPES)[number];
  action: (typeof ACTIONS)[number];
  timeWindow: string;
};

type Photo = {
  key: string;
  url: string;
  caption: string;
};

type Props = {
  mode: "new" | "edit";
  propertyId?: string;
  initial?: {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    hhwInstructions: string | null;
    porterId: string | null;
    schedule: Array<Omit<ScheduleRow, "key">>;
    setupPhotos: Array<Omit<Photo, "key">>;
  };
};

export function PropertyWizard({ mode, propertyId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [latitude, setLatitude] = useState<string>(
    initial?.latitude?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState<string>(
    initial?.longitude?.toString() ?? "",
  );
  const [hhwInstructions, setHhwInstructions] = useState(
    initial?.hhwInstructions ?? "",
  );

  const [porters, setPorters] = useState<Porter[]>([]);
  const [porterId, setPorterId] = useState<string>(initial?.porterId ?? "");
  const [addingPorter, setAddingPorter] = useState(false);
  const [newPorterName, setNewPorterName] = useState("");
  const [newPorterTitle, setNewPorterTitle] = useState("");
  const [newPorterPhoto, setNewPorterPhoto] = useState<File | null>(null);

  const [schedule, setSchedule] = useState<ScheduleRow[]>(
    (initial?.schedule ?? []).map((s, i) => ({
      key: `r${i}`,
      dayOfWeek: s.dayOfWeek,
      binType: s.binType as (typeof BIN_TYPES)[number],
      action: s.action as (typeof ACTIONS)[number],
      timeWindow: s.timeWindow ?? "",
    })),
  );

  const [photos, setPhotos] = useState<Photo[]>(
    (initial?.setupPhotos ?? []).map((p, i) => ({
      key: `p${i}`,
      url: p.url,
      caption: p.caption ?? "",
    })),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Address confirmation: geocode the typed address and show the matched
  // place back to the admin so they can confirm it's correct. lat/lng are
  // stored silently for the backend — no longer shown as fields.
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "checking" | "ok" | "notfound"
  >(initial?.latitude != null ? "ok" : "idle");
  const [geoMatch, setGeoMatch] = useState<string>(
    initial?.latitude != null ? initial.address : "",
  );

  useEffect(() => {
    fetch("/api/admin/porters")
      .then((r) => r.json())
      .then((j) => setPorters(j.porters ?? []))
      .catch(() => {});
  }, []);

  // Geocode the address (public Nominatim) to (a) confirm it resolves to a
  // real place — shown back to the admin for double-checking — and (b) fill
  // lat/lng silently for the backend. Runs on blur and via the Verify button.
  async function tryGeocode() {
    const q = address.trim();
    if (!q) {
      setGeoStatus("idle");
      setGeoMatch("");
      return;
    }
    setGeoStatus("checking");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        setLatitude(data[0].lat);
        setLongitude(data[0].lon);
        setGeoMatch(data[0].display_name ?? q);
        setGeoStatus("ok");
      } else {
        setGeoStatus("notfound");
        setGeoMatch("");
      }
    } catch {
      setGeoStatus("notfound");
      setGeoMatch("");
    }
  }

  async function uploadFile(file: File, subdir: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("subdir", subdir);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  }

  async function onPhotosChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        const url = await uploadFile(f, "setup");
        if (url) {
          setPhotos((prev) => [
            ...prev,
            { key: `${Date.now()}-${Math.random()}`, url, caption: "" },
          ]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  function addScheduleRow() {
    setSchedule((prev) => [
      ...prev,
      {
        key: `r${Date.now()}`,
        dayOfWeek: 2,
        binType: "TRASH",
        action: "PULL_OUT",
        timeWindow: "",
      },
    ]);
  }

  function updateScheduleRow(key: string, patch: Partial<ScheduleRow>) {
    setSchedule((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeScheduleRow(key: string) {
    setSchedule((prev) => prev.filter((r) => r.key !== key));
  }

  async function savePorter() {
    if (!newPorterName.trim()) return;
    let photoUrl: string | null = null;
    if (newPorterPhoto) {
      photoUrl = await uploadFile(newPorterPhoto, "porters");
    }
    const res = await fetch("/api/admin/porters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPorterName,
        title: newPorterTitle,
        photoUrl,
      }),
    });
    if (!res.ok) {
      setError("Couldn't add porter");
      return;
    }
    const { porter } = await res.json();
    setPorters((prev) => [...prev, porter]);
    setPorterId(porter.id);
    setAddingPorter(false);
    setNewPorterName("");
    setNewPorterTitle("");
    setNewPorterPhoto(null);
  }

  async function submit() {
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError("Building name and address are required");
      return;
    }
    setSubmitting(true);
    try {
      const lat = latitude ? Number(latitude) : null;
      const lng = longitude ? Number(longitude) : null;
      const body = {
        name: name.trim(),
        address: address.trim(),
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
        hhwInstructions: hhwInstructions.trim() || null,
        porterId: porterId || null,
        schedule: schedule.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          binType: s.binType,
          action: s.action,
          timeWindow: s.timeWindow.trim() || null,
        })),
        setupPhotos: photos.map((p) => ({
          url: p.url,
          caption: p.caption.trim() || null,
        })),
      };

      const url =
        mode === "new"
          ? "/api/admin/properties"
          : `/api/admin/properties/${propertyId}`;
      const method = mode === "new" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      const data = await res.json();
      const targetId = data.id ?? propertyId;
      router.push(`/admin/properties/${targetId}/qr`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Name + Address */}
      <Section number={1} title="Building name + address">
        <Field label="Name (shown to residents)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 1919 Market Street"
            className="w-full input"
          />
        </Field>
        <Field label="Address">
          <div className="flex gap-2">
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (geoStatus !== "idle") setGeoStatus("idle");
              }}
              onBlur={tryGeocode}
              placeholder="1919 Market St, Oakland, CA 94607"
              className="w-full input"
            />
            <button
              type="button"
              onClick={tryGeocode}
              disabled={!address.trim() || geoStatus === "checking"}
              className="shrink-0 btn-secondary"
            >
              {geoStatus === "checking" ? "Checking…" : "Verify"}
            </button>
          </div>

          {/* Address double-confirmation */}
          {geoStatus === "ok" && (
            <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <span className="font-medium">✓ Address found.</span> Please
              confirm this is the right place:
              <div className="mt-1 text-emerald-900">{geoMatch}</div>
            </div>
          )}
          {geoStatus === "notfound" && (
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              ⚠ Couldn&apos;t locate that address. Double-check spelling, city,
              and ZIP — you can still save, but the location won&apos;t be set.
            </div>
          )}
        </Field>
      </Section>

      {/* 2. Trash Scout */}
      <Section number={2} title="Trash Scout assigned">
        {!addingPorter ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={porterId}
              onChange={(e) => setPorterId(e.target.value)}
              className="flex-1 input"
            >
              <option value="">— No porter assigned —</option>
              {porters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.title ? ` (${p.title})` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingPorter(true)}
              className="btn-secondary"
            >
              + Add new porter
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="text-sm font-medium">New porter</div>
            <input
              value={newPorterName}
              onChange={(e) => setNewPorterName(e.target.value)}
              placeholder="Full name"
              className="w-full input"
            />
            <input
              value={newPorterTitle}
              onChange={(e) => setNewPorterTitle(e.target.value)}
              placeholder="Title (e.g. Field Supervisor)"
              className="w-full input"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPorterPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={savePorter}
                disabled={!newPorterName.trim()}
                className="btn-primary"
              >
                Save porter
              </button>
              <button
                type="button"
                onClick={() => setAddingPorter(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* 3. Setup photos */}
      <Section number={3} title="Setup photos">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={onPhotosChosen}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200 disabled:opacity-50"
        />
        {uploading && (
          <p className="text-xs text-zinc-500">Uploading…</p>
        )}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <div
                key={p.key}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
              >
                <div className="relative aspect-square w-full bg-zinc-100">
                  <Image
                    src={p.url}
                    alt={p.caption || ""}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <div className="space-y-1 p-2">
                  <input
                    value={p.caption}
                    onChange={(e) =>
                      setPhotos((prev) =>
                        prev.map((x) =>
                          x.key === p.key ? { ...x, caption: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Caption (optional)"
                    className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.key)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 4. Schedule */}
      <Section number={4} title="Push / pull schedule">
        <p className="mb-3 text-sm text-zinc-500">
          Add a row for when each bin goes <strong>out</strong> and when it
          comes <strong>back in</strong>, and set the time for each so
          residents know exactly when.
        </p>
        {schedule.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No rows yet. Add one for each day a bin goes out or comes in.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-2 pb-2">Day</th>
                  <th className="px-2 pb-2">Bin</th>
                  <th className="px-2 pb-2">Action</th>
                  <th className="px-2 pb-2">Time</th>
                  <th className="px-2 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((r) => (
                  <tr key={r.key} className="border-t border-zinc-100">
                    <td className="px-2 py-1">
                      <select
                        value={r.dayOfWeek}
                        onChange={(e) =>
                          updateScheduleRow(r.key, {
                            dayOfWeek: Number(e.target.value),
                          })
                        }
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        {DAY_NAMES.map((d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={r.binType}
                        onChange={(e) =>
                          updateScheduleRow(r.key, {
                            binType: e.target
                              .value as (typeof BIN_TYPES)[number],
                          })
                        }
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        {BIN_TYPES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={r.action}
                        onChange={(e) =>
                          updateScheduleRow(r.key, {
                            action: e.target
                              .value as (typeof ACTIONS)[number],
                          })
                        }
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        <option value="PULL_OUT">Pull out</option>
                        <option value="RETURN">Return</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={r.timeWindow}
                        onChange={(e) =>
                          updateScheduleRow(r.key, { timeWindow: e.target.value })
                        }
                        className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        <option value="">— time —</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeScheduleRow(r.key)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={addScheduleRow}
          className="btn-secondary"
        >
          + Add row
        </button>
      </Section>

      {/* 5. HHW instructions */}
      <Section
        number={5}
        title="Property-specific Household Hazardous Waste instructions (optional)"
      >
        <textarea
          rows={4}
          value={hhwInstructions}
          onChange={(e) => setHhwInstructions(e.target.value)}
          placeholder="Example: Battery + medication drop bin in the lobby. Paint and electronics go to the Oakland HHW facility on E. 7th."
          className="w-full input"
        />
      </Section>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting
            ? "Saving…"
            : mode === "new"
              ? "✓ Generate QR Code"
              : "✓ Save & view QR"}
        </button>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold tracking-tight">
        <span className="text-zinc-400">{number}.</span>{" "}
        <span className="text-zinc-900">{title}</span>
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}
