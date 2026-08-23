import { NextResponse, type NextRequest } from "next/server";

import { localeBySlug } from "@/lib/i18n/config";

/**
 * Hybrid locale routing (plan K1 / spec FR-3..FR-5):
 *  - "/ur/features"  → real route under app/[locale], passes through untouched.
 *  - "/features"     → internally rewritten to /en/features; browser URL stays bare.
 *  - No redirects, no header/IP sniffing — URLs alone decide language (FR-4).
 */
export function proxy(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/")[1] ?? "";

  if (localeBySlug(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
