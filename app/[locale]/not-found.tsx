import Link from "next/link";
import { locale } from "next/root-params";

import { isLocale, LOCALE_REGISTRY } from "@/lib/i18n/config";

/**
 * Localized 404 for unmatched paths under a valid locale prefix. Renders
 * inside app/[locale]/layout.tsx, so lang/dir/fonts are already correct;
 * copy is localized once the string loader is wired (T6).
 */
export default async function LocaleNotFound() {
  const raw = await locale();
  const dir = isLocale(raw) ? LOCALE_REGISTRY[raw].dir : "ltr";

  return (
    <main dir={dir} className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="eyebrow text-agro-canopy">404</p>
      <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink">
        Page not found
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-agro-canopy px-6 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
      >
        Back to Agropioo home
      </Link>
    </main>
  );
}
