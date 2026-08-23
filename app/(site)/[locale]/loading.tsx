/**
 * Route-level loading UI for all locale pages. Shown while server-rendered
 * content (including translation fetches) streams in during client-side
 * navigation. Brand tokens only; respects prefers-reduced-motion via the
 * global kill-switch in globals.css.
 */
export default function LocaleLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center">
        <svg className="h-9 w-9 animate-spin text-agro-canopy" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
        </svg>
      </span>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-agro-slate">
        Loading…
      </p>
    </div>
  );
}
