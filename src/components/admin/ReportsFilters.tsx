"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export function ReportsFilters({
  properties,
  porters,
  categories,
  current,
}: {
  properties: Option[];
  porters: Option[];
  categories: Option[];
  current: {
    status: string;
    property: string;
    porter: string;
    category: string;
  };
}) {
  const router = useRouter();

  // Rebuild the query string with one field changed, reset to page 1.
  function setParam(key: string, value: string) {
    const params = new URLSearchParams();
    const next = { ...current, [key]: value };
    if (next.status) params.set("status", next.status);
    if (next.property) params.set("property", next.property);
    if (next.porter) params.set("porter", next.porter);
    if (next.category) params.set("category", next.category);
    const qs = params.toString();
    router.push(`/admin/issues${qs ? `?${qs}` : ""}`);
  }

  const hasFilters =
    current.status || current.property || current.porter || current.category;

  return (
    <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/issues")}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSelect
        label="Status"
        value={current.status}
        onChange={(v) => setParam("status", v)}
        allLabel="Any status"
        options={[
          { value: "OPEN", label: "Open" },
          { value: "IN_PROGRESS", label: "In progress" },
          { value: "RESOLVED", label: "Resolved" },
        ]}
      />
      <FilterSelect
        label="Property"
        value={current.property}
        onChange={(v) => setParam("property", v)}
        allLabel="All properties"
        options={properties}
      />
      <FilterSelect
        label="Porter"
        value={current.porter}
        onChange={(v) => setParam("porter", v)}
        allLabel="All porters"
        options={porters}
      />
      <FilterSelect
        label="Type of issue"
        value={current.category}
        onChange={(v) => setParam("category", v)}
        allLabel="All types"
        options={categories}
      />
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: Option[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full input"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
