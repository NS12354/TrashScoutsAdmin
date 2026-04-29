import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { getAllProperties } from "@/lib/data";

export const metadata = {
  title: "Trash Scouts",
  description:
    "Find your building and get your trash schedule, porter, and reporting tools.",
};

export default function Home() {
  const properties = getAllProperties();

  return (
    <div className="min-h-screen bg-surface-tint text-zinc-900">
      <div className="mx-auto w-full max-w-md px-5 pb-16">
        <BrandHeader />

        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Find your building
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tap your address to see your trash schedule, porter, and reporting tools.
          </p>
        </div>

        <ul className="mt-5 space-y-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md hover:ring-zinc-300"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900">{p.name}</div>
                  <div className="mt-0.5 text-sm text-zinc-500">{p.address}</div>
                </div>
                <span className="text-zinc-400" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-12 flex items-center justify-center gap-3 text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-700 hover:underline">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-zinc-700 hover:underline">
            Terms
          </Link>
        </footer>
      </div>
    </div>
  );
}
