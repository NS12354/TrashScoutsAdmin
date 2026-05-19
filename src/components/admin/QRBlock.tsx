"use client";

import { useEffect, useState } from "react";

export function QRBlock({
  slug,
  name,
  address,
}: {
  slug: string;
  name: string;
  address: string;
}) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Window-only read; ESLint flags setState-in-effect but this is the
    // standard hydration pattern (server can't know window.location).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const residentUrl = origin ? `${origin}/p/${slug}` : "";
  const qrSrc = origin
    ? `/api/qr?path=${encodeURIComponent(`/p/${slug}`)}&size=400`
    : "";
  const downloadUrl = `/api/qr?path=${encodeURIComponent(`/p/${slug}`)}&size=800&download=1`;

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-xl bg-white p-2 ring-1 ring-zinc-200">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt="QR code" width={240} height={240} />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded-lg bg-zinc-100" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="text-sm font-semibold text-zinc-700">{name}</div>
          <div className="text-xs text-zinc-500">{address}</div>
          <div className="mt-3 break-all rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
            {residentUrl || "…"}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {residentUrl && (
              <>
                <a
                  href={downloadUrl}
                  className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  ⬇ Download PNG
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                  🖨 Print sheet
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(residentUrl)}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                  Copy URL
                </button>
                <a
                  href={residentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                  Open resident page ↗
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
