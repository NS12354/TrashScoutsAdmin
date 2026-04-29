import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-tint text-zinc-900">
      <div className="mx-auto w-full max-w-md px-5 pb-12">
        {children}
        <footer className="mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
          <div>
            Powered by{" "}
            <span className="font-semibold text-zinc-700">{BRAND_NAME}</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-3">
            <Link href="/privacy" className="hover:text-zinc-700 hover:underline">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-zinc-700 hover:underline">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
