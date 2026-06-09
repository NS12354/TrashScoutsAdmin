"use client";

import { useState } from "react";
import { BIN_LABEL } from "@/lib/format";
import type { CountyGuide, GuideItem, GuideMaterial } from "@/data/countyGuides";

// Mimics resource.stopwaste.org/curbside's layout: a tab strip across
// the top for each bin, then an expanded list of items with prep
// notes ("Empty and drip-free", "Flatten", etc.). Item icons are
// emoji so they render universally without hotlinking agency assets.

const BIN_HEADER_COLOR: Record<string, string> = {
  TRASH: "bg-zinc-800 text-white",
  RECYCLING: "bg-blue-600 text-white",
  ORGANICS: "bg-green-700 text-white",
  SPECIAL: "bg-amber-600 text-white",
};

function tabAccent(bin: string, active: boolean): string {
  if (!active) return "border-transparent text-zinc-500 hover:text-zinc-700";
  switch (bin) {
    case "RECYCLING":
      return "border-blue-600 text-blue-700";
    case "ORGANICS":
      return "border-green-700 text-green-800";
    case "TRASH":
      return "border-zinc-800 text-zinc-900";
    case "SPECIAL":
      return "border-amber-600 text-amber-700";
    default:
      return "border-zinc-500 text-zinc-700";
  }
}

function binTitle(m: GuideMaterial): string {
  if (m.bin === "SPECIAL") return "Special Items";
  return BIN_LABEL[m.bin] ?? m.tabLabel;
}

export function WhatGoesWhereCards({ guide }: { guide: CountyGuide }) {
  const [activeBin, setActiveBin] = useState<string>(
    guide.materials[0]?.bin ?? "RECYCLING",
  );
  const active =
    guide.materials.find((m) => m.bin === activeBin) ?? guide.materials[0];
  if (!active) return null;

  return (
    <div>
      {/* Tab strip. Horizontal scroll on narrow screens so labels never
          truncate awkwardly. */}
      <div
        role="tablist"
        aria-label="Sorting categories"
        className="-mx-1 mb-3 flex gap-1 overflow-x-auto border-b border-zinc-200 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {guide.materials.map((m) => {
          const isActive = m.bin === activeBin;
          return (
            <button
              key={m.bin}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveBin(m.bin)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${tabAccent(m.bin, isActive)}`}
            >
              <span aria-hidden>{m.headerEmoji}</span>
              <span>{m.tabLabel}</span>
            </button>
          );
        })}
      </div>

      <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <header
          className={`flex items-center gap-3 px-4 py-3 ${
            BIN_HEADER_COLOR[active.bin] ?? "bg-zinc-700 text-white"
          }`}
        >
          <span className="text-2xl leading-none" aria-hidden>
            {active.headerEmoji}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
              {binTitle(active)}
            </div>
            <div className="text-[15px] font-semibold leading-tight">
              {active.summary}
            </div>
          </div>
        </header>

        <div
          className={`grid gap-5 p-4 ${
            active.no.length === 0 ? "" : "sm:grid-cols-2"
          }`}
        >
          <ItemList
            title={active.bin === "SPECIAL" ? "How to dispose" : "✓ Yes"}
            titleClass={
              active.bin === "SPECIAL" ? "text-amber-700" : "text-emerald-700"
            }
            items={active.yes}
          />
          {active.no.length > 0 && (
            <ItemList
              title="✗ Keep out"
              titleClass="text-rose-700"
              items={active.no}
            />
          )}
        </div>
      </article>

      {guide.tips.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
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
      <div
        className={`text-xs font-semibold uppercase tracking-wide ${titleClass}`}
      >
        {title}
      </div>
      <ul className="mt-2.5 space-y-2.5">
        {items.map((it) => (
          <li key={it.name} className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-lg leading-none"
            >
              {it.emoji}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium leading-tight text-zinc-900">
                {it.name}
              </div>
              {it.note && (
                <div className="mt-0.5 text-xs leading-snug text-zinc-500">
                  {it.note}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

