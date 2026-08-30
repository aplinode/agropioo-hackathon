export default function WeatherLoading() {
  return (
    <div className="pt-1" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 animate-pulse rounded bg-agro-sprout/60" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded bg-agro-sprout/60" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-agro-sprout/40" />
      <div className="mt-5 h-40 w-full animate-pulse rounded-3xl bg-agro-sprout/50" />
      <div className="mt-5 h-32 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
      <div className="mt-7 space-y-3">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-agro-sprout/40" />
      </div>
    </div>
  );
}
