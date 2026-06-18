"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Inline delete button used in the proposals list + Current Agreement
// card. Signed agreements get a stronger confirm prompt because
// dropping them also drops the signed-copy record on cascade.

export function DeleteProposalButton({
  proposalId,
  signed = false,
  clientName,
  variant = "icon",
}: {
  proposalId: string;
  signed?: boolean;
  clientName?: string;
  // "icon" = small × button suited for table row trailing cell.
  // "text" = pill button suited for the Current Agreement card.
  variant?: "icon" | "text";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const who = clientName ? ` for ${clientName}` : "";
    const prompt = signed
      ? `Delete this proposal${who}? The signed agreement will also be deleted — this can't be undone.`
      : `Delete this proposal${who}? This can't be undone.`;
    if (!confirm(prompt)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
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

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      title={signed ? "Delete proposal + signed copy" : "Delete proposal"}
      aria-label="Delete proposal"
      className="ml-1 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      ×
    </button>
  );
}
