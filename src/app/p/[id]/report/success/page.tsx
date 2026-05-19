import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="ts-success-circle grid h-24 w-24 place-items-center rounded-full bg-brand/15 text-brand-dark">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12"
          >
            <path
              className="ts-success-check"
              pathLength={100}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="ts-success-fade-1 mt-5 text-2xl font-semibold tracking-tight">
          Submitted
        </h1>
        <p className="ts-success-fade-2 mt-2 max-w-xs text-sm text-zinc-600">
          Thanks — your report is on its way to the Trash Scouts team.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-2">
        <Link
          href={`/p/${id}`}
          className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          Back to home
        </Link>
        <Link
          href={`/p/${id}/hhw`}
          className="rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          Read the HHW guide
        </Link>
      </div>
    </>
  );
}
