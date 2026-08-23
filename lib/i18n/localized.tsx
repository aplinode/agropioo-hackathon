import type { ReactNode } from "react";

import { LOCALE_REGISTRY, type Locale } from "./config";
import type { ResolvedString } from "./logic";

/**
 * Renders a resolved string; an English fallback inside an RTL page is wrapped
 * so it reads as English and cannot corrupt surrounding bidi order (FR-12).
 * Empty results (key missing everywhere) render nothing — never raw keys.
 */
export function localized(resolved: ResolvedString, locale: Locale): ReactNode {
  if (resolved.text === "") return null;
  const entry = LOCALE_REGISTRY[locale];
  if (!resolved.isFallback || entry.dir === "ltr") return resolved.text;
  return (
    <span lang="en" dir="ltr">
      {resolved.text}
    </span>
  );
}
