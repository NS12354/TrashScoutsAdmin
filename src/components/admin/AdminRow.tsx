"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Admin = {
  id: string;
  email: string;
  name: string;
  createdAt: Date | string;
  // Kept on the type for compatibility with the DB shape, but no longer
  // surfaced — self-signup activates users immediately.
  passwordSetAt: Date | string | null;
};

export function AdminRow({
  admin,
  isYou,
  totalAdmins,
}: {
  admin: Admin;
  isYou: boolean;
  totalAdmins: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = !isYou && totalAdmins > 1;

  async function remove() {
    const ok = window.confirm(
      `Remove admin “${admin.name}” (${admin.email})? They'll lose access immediately.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
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

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-500">
        {admin.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{admin.name}</span>
          {isYou && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
              you
            </span>
          )}
        </div>
        <div className="truncate text-sm text-zinc-500">{admin.email}</div>
        <div className="text-xs text-zinc-400">
          Joined {new Date(admin.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={remove}
          disabled={busy || !canDelete}
          title={
            isYou
              ? "You can't remove your own account"
              : totalAdmins <= 1
                ? "Can't remove the last admin"
                : undefined
          }
          className="btn-sm-danger disabled:cursor-not-allowed"
        >
          {busy ? "…" : "Remove"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </li>
  );
}
