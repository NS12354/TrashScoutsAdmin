"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Admin = {
  id: string;
  email: string;
  name: string;
  createdAt: Date | string;
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
  const [busy, setBusy] = useState<"none" | "delete" | "resend">("none");
  const [error, setError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendLink, setResendLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canDelete = !isYou && totalAdmins > 1;
  const pending = !admin.passwordSetAt;

  async function remove() {
    const ok = window.confirm(
      `Remove admin “${admin.name}” (${admin.email})? They'll lose access immediately.`,
    );
    if (!ok) return;
    setBusy("delete");
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
      setBusy("none");
    }
  }

  async function resendInvite() {
    setBusy("resend");
    setError(null);
    setResendNotice(null);
    setResendLink(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}/resend-invite`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Resend failed");
      }
      const data = await res.json();
      setResendNotice(
        data.skipped
          ? "Email is not configured — copy the link below and share it manually."
          : data.sent
            ? `Invite re-sent to ${admin.email}.`
            : "Email send failed — copy the link below and share it manually.",
      );
      // Surface the link whenever the email didn't actually deliver, so the
      // admin always has a fallback path to share the invite.
      if (!data.sent) setResendLink(data.link ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setBusy("none");
    }
  }

  async function copyLink() {
    if (!resendLink) return;
    try {
      await navigator.clipboard.writeText(resendLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard write rejected — user can still select manually */
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
          {pending && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Pending invite
            </span>
          )}
        </div>
        <div className="truncate text-sm text-zinc-500">{admin.email}</div>
        <div className="text-xs text-zinc-400">
          Added {new Date(admin.createdAt).toLocaleDateString()}
        </div>
        {resendNotice && (
          <div className="mt-1 space-y-1">
            <div className="text-xs text-emerald-700">{resendNotice}</div>
            {resendLink && (
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded bg-zinc-100 px-2 py-1 font-mono text-[11px] text-zinc-700">
                  {resendLink}
                </code>
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex gap-2">
          {pending && !isYou && (
            <button
              type="button"
              onClick={resendInvite}
              disabled={busy !== "none"}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-60"
            >
              {busy === "resend" ? "…" : "Resend invite"}
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={busy !== "none" || !canDelete}
            title={
              isYou
                ? "You can't remove your own account"
                : totalAdmins <= 1
                  ? "Can't remove the last admin"
                  : undefined
            }
            className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "delete" ? "…" : "Remove"}
          </button>
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </li>
  );
}
