"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PropertyPricingDeleteButton({
  quoteId,
}: {
  quoteId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this saved quote? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pricing-quotes/${quoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="ml-2 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      aria-label="Delete quote"
    >
      ×
    </button>
  );
}
