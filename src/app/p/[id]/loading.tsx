// Suspense fallback for property pages — shown while server-side data
// resolves. The pages are SSG so this rarely shows on first paint, but
// covers slow recovery from background refresh.
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
      <div className="h-7 w-2/3 rounded bg-zinc-100 animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-zinc-100 animate-pulse" />
      <div className="aspect-[4/3] w-full rounded-2xl bg-zinc-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
      </div>
    </div>
  );
}
