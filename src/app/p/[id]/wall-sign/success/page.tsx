import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

export default async function WallSignSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand-dark">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-3 text-xl font-semibold">Request received</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll reach out by email to confirm the details and next steps.
        </p>
        <Link
          href={`/p/${id}`}
          className="mt-5 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Back to home
        </Link>
      </div>
    </>
  );
}
