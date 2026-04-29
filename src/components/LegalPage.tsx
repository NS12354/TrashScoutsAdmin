import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { TruckIcon } from "./TruckIcon";

const CUSTOM_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || "";

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-tint text-zinc-900">
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <header className="flex items-center gap-3 pb-2">
          <Link
            href="/"
            aria-label="Home"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-700 hover:bg-zinc-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex flex-1 items-center justify-center gap-2 text-brand">
            {CUSTOM_LOGO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={CUSTOM_LOGO}
                alt={BRAND_NAME}
                className="h-[84px] w-auto"
              />
            ) : (
              <>
                <TruckIcon className="h-6 w-9" />
                <span className="text-base font-bold tracking-[0.18em]">
                  {BRAND_NAME.toUpperCase()}
                </span>
              </>
            )}
          </div>
          <div className="h-9 w-9" aria-hidden />
        </header>

        <article className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-700">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="text-sm text-zinc-500">
            Effective {effectiveDate}. Questions: {SUPPORT_EMAIL}.
          </p>
          {children}
        </article>
      </div>
    </div>
  );
}
