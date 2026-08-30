export default function HistoryLoading() {
  return (
    <div className="pt-1" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 animate-pulse rounded bg-agro-sprout/60" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded bg-agro-sprout/60" />
      <div className="mt-7 space-y-3">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
      </div>
    </div>
  );
}
