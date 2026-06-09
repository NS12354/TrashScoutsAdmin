import { BIN_COLOR, BIN_LABEL } from "@/lib/format";
import type { CountyGuide, GuideItem } from "@/data/countyGuides";

// Renders the per-county "What Goes Where" content as a stack of
// material cards. Each card uses the same color as the Service
// Schedule bin badges so the visual language stays consistent across
// the resident pages.

export function WhatGoesWhereCards({ guide }: { guide: CountyGuide }) {
  return (
    <div className="space-y-3">
      {guide.materials.map((m) => (
        <article
          key={m.bin}
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
        >
          <header
            className={`flex items-center gap-3 px-4 py-3 ${
              BIN_COLOR[m.bin] ?? "bg-zinc-700 text-white"
            }`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {m.headerEmoji}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {BIN_LABEL[m.bin] ?? m.bin}
              </div>
              <div className="text-[15px] font-semibold leading-tight">
                {m.summary}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <ItemList
              title="✓ Yes"
              titleClass="text-emerald-700"
              items={m.yes}
            />
            <ItemList
              title="✗ Keep out"
              titleClass="text-rose-700"
              items={m.no}
            />
          </div>
        </article>
      ))}

      {guide.tips.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Quick tips
          </div>
          <ul className="mt-2 space-y-1.5">
            {guide.tips.map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-sm text-zinc-700"
              >
                <span aria-hidden className="mt-0.5 text-brand-dark">
                  •
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ItemList({
  title,
  titleClass,
  items,
}: {
  title: string;
  titleClass: string;
  items: GuideItem[];
}) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${titleClass}`}>
        {title}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li
            key={it.name}
            className="flex items-center gap-2.5 text-[14px] text-zinc-700"
          >
            <span aria-hidden className="text-xl leading-none">
              {it.emoji}
            </span>
            <span className="min-w-0">{it.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
