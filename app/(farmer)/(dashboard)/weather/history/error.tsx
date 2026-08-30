"use client";

export default function HistoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-1" role="alert">
      <h1 className="text-lg font-semibold text-agro-forest">Something went wrong</h1>
      <p className="mt-1 text-sm text-agro-slate">
        We could not load your advisory history. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
      >
        Retry
      </button>
    </div>
  );
}
