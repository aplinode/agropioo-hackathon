import Link from "next/link";

import "./globals.css";

/**
 * Routing-level 404 for URLs that match no route at all (e.g. "/xx/features",
 * typos). Renders its own <html> because app/[locale]/layout.tsx is the root
 * layout. Localized 404s for valid locale prefixes live in
 * app/[locale]/not-found.tsx instead (spec FR-5, AC-5).
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-agro-paper px-6 py-24 text-center">
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
      </body>
    </html>
  );
}
