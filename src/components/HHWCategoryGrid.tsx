import type { HHWCategory } from "@/lib/hhwCategories";

export function HHWCategoryGrid({ categories }: { categories: HHWCategory[] }) {
  return (
    <ul className="space-y-2">
      {categories.map((c) => (
        <li
          key={c.key}
          className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <Icon name={c.icon} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900">{c.name}</div>
            <p className="mt-0.5 text-sm text-zinc-600">{c.blurb}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Icon({ name }: { name: HHWCategory["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor" as const,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
  };
  switch (name) {
    case "paint":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="6" rx="1" />
          <path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9" />
          <path d="M21 6h2v4h-2" />
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect x="2" y="7" width="18" height="10" rx="2" />
          <path d="M22 11v2" />
          <path d="M6 10v4M10 10v4" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a7 7 0 00-4 12.7c.8.7 1.3 1.7 1.3 2.8V18h5.4v-.5c0-1.1.5-2.1 1.3-2.8A7 7 0 0012 2z" />
        </svg>
      );
    case "spray":
      return (
        <svg {...common}>
          <path d="M9 3h4v4H9z" />
          <path d="M7 7h8l1 4v9a2 2 0 01-2 2H8a2 2 0 01-2-2v-9l1-4z" />
          <path d="M14 4h2M14 6h3M14 8h3" />
        </svg>
      );
    case "pill":
      return (
        <svg {...common}>
          <path d="M10.5 20.5a6 6 0 01-8.5-8.5l9.5-9.5a6 6 0 018.5 8.5z" />
          <path d="M6.25 6.25l11.5 11.5" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case "fuel":
      return (
        <svg {...common}>
          <path d="M3 22h12V4a2 2 0 00-2-2H5a2 2 0 00-2 2v18z" />
          <path d="M15 8h2a3 3 0 013 3v6a2 2 0 11-4 0v-2a2 2 0 00-2-2" />
        </svg>
      );
  }
}
