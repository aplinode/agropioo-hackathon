import type { ReactNode } from "react";

/* FR-17 — bidi isolation for always-Latin demo fragments (names, emails,
   numerals, place names). Forces LTR base direction and isolates the
   fragment so the surrounding RTL sentence keeps its own reading order.
   Safe in LTR pages (no visual effect). */
export function LatinInline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      dir="ltr"
      lang="en"
      className={className}
      style={{ unicodeBidi: "isolate" }}
    >
      {children}
    </span>
  );
}
