import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n/config";

/**
 * Hybrid locale routing (plan K1 / spec FR-3..FR-5):
 *  - "/ur/features"  → real route under app/[locale], passes through untouched.
 *  - "/en/features"  → real route under app/[locale], passes through untouched.
 *  - "/features"     → internally rewritten to /en/features; browser URL stays bare.
 *  - No redirects, no header/IP sniffing — URLs alone decide language (FR-4).
 */
export function proxy(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/")[1] ?? "";

  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Farmer-app and auth-app paths are REAL routes outside [locale] (English
  // at launch) — excluding them keeps them off the locale rewriter entirely;
  // a rewritten /verify would fall into the [...rest] catch-all instead.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|dashboard|farms|profit-loss|advisor|detect|pest|prices|notifications|settings|more|records|forgot-password|reset-password|verify|weather|onboarding|crops).*)",
  ],
};
