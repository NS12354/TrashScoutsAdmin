"use client";

import { useMemo, useState } from "react";
import { groupByCategory } from "@/lib/documents";
import { DocumentRow, type AdminDocument } from "./DocumentRow";

export function DocumentLibrary({ documents }: { documents: AdminDocument[] }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? documents.filter((d) =>
          // Filename is searchable too — people often remember what the
          // file was called even when the title was rewritten on upload.
          [d.title, d.description ?? "", d.filename].some((field) =>
            field.toLowerCase().includes(q),
          ),
        )
      : documents;
    return groupByCategory(matched);
  }, [documents, query]);

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
        No documents yet. Upload your first SOP using the form.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents…"
        className="w-full input"
        aria-label="Search documents"
      />

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          Nothing matches “{query.trim()}”.
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.value}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
          >
            <h2 className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {group.label}
              <span className="ml-2 font-normal text-zinc-400">
                {group.docs.length}
              </span>
            </h2>
            <ul className="divide-y divide-zinc-100">
              {group.docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
