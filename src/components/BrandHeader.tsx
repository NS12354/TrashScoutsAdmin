import Link from "next/link";
import { TruckIcon } from "./TruckIcon";
import { BRAND_NAME } from "@/lib/brand";

const CUSTOM_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || "";

export function BrandHeader({
  backHref,
}: {
  backHref?: string;
}) {
  return (
    <header className="flex items-center gap-3 pt-5 pb-2">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
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
      ) : (
        <div className="h-9 w-9" aria-hidden />
      )}

      <div className="flex flex-1 items-center justify-center gap-2 text-brand">
        {CUSTOM_LOGO ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={CUSTOM_LOGO} alt={BRAND_NAME} className="h-[84px] w-auto" />
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
  );
}
