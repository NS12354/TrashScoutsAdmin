import Link from "next/link";

type Tile = {
  href: string;
  number: number;
  label: string;
  icon: React.ReactNode;
};

export function TileNav({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {tiles.map((t) => (
        <li key={t.number}>
          <Link
            href={t.href}
            className="flex h-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md hover:ring-zinc-300"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand-dark">
              {t.icon}
            </div>
            <div className="text-base font-semibold leading-tight text-zinc-900">
              <span className="text-zinc-400">{t.number}.</span>{" "}
              <span>{t.label}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const TileIcons = {
  Camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 11v2a2 2 0 002 2h2l5 4V5L7 9H5a2 2 0 00-2 2z" />
      <path d="M16 8a5 5 0 010 8" />
    </svg>
  ),
  Warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Recycle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M7 19H5a2 2 0 01-1.8-2.9l1.7-3.4M17 5h2a2 2 0 011.8 2.9L19.1 11M14 19h-4l2-3" />
      <path d="M9 5l3-3 3 3M5 12l-3-3 3-3" />
    </svg>
  ),
};
