"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePropertyButton({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const ok = window.confirm(
      `Delete “${propertyName}”? This removes the property, its schedule, photos, and all submitted reports. The QR code already printed and posted will stop working.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      router.push("/admin/properties");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-5">
      <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
      <p className="mt-1 text-sm text-red-700">
        Removing a property is permanent. Any QR code already printed will lead
        to a “not found” page.
      </p>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Delete this property"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
