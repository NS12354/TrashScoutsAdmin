"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoLightbox } from "./PhotoLightbox";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  subcaption: string | null;
};

export function SetupPhotoGrid({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => setActive(p)}
            className="overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <div className="relative aspect-square w-full bg-zinc-100">
              <Image
                src={p.url}
                alt={p.caption ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 320px"
              />
            </div>
            {(p.caption || p.subcaption) && (
              <div className="space-y-0.5 px-3 py-2">
                {p.caption && (
                  <div className="text-sm font-semibold text-zinc-900">
                    {p.caption}
                  </div>
                )}
                {p.subcaption && (
                  <div className="text-xs text-zinc-600">{p.subcaption}</div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
      {active && (
        <PhotoLightbox
          src={active.url}
          caption={active.caption}
          subcaption={active.subcaption}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
