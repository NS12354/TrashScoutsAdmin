"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueCategoryLabel } from "@/lib/format";

type IssuePhoto = { id: string; url: string };

export function IssueRow({
  issue,
}: {
  issue: {
    id: string;
    category: string;
    description: string | null;
    reporterName: string | null;
    reporterContact: string | null;
    status: string;
    createdAt: Date | string;
    property: { name: string; address: string };
    photos: IssuePhoto[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(issue.status);

  async function update(next: string) {
    setStatus(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setStatus(issue.status); // revert
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            {new Date(issue.createdAt).toLocaleString()}
          </div>
          <div className="mt-0.5 font-semibold">
            {issueCategoryLabel(issue.category)}
          </div>
          <div className="text-sm capitalize text-zinc-500">
            {issue.property.name} — {issue.property.address}
          </div>
        </div>
        <select
          value={status}
          onChange={(e) => update(e.target.value)}
          disabled={pending}
          className={`rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm ${pending ? "opacity-60" : ""}`}
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {issue.description && (
        <p className="mt-3 text-[15px] text-zinc-700">{issue.description}</p>
      )}

      {issue.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {issue.photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="relative block h-20 w-20 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
            >
              <Image src={p.url} alt="" fill className="object-cover" sizes="80px" />
            </a>
          ))}
        </div>
      )}

      {(issue.reporterName || issue.reporterContact) && (
        <div className="mt-3 text-sm text-zinc-600">
          Reported by{" "}
          <span className="font-medium capitalize">{issue.reporterName ?? "—"}</span>
          {issue.reporterContact && ` · ${issue.reporterContact}`}
        </div>
      )}
    </article>
  );
}
