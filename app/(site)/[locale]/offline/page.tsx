import Link from "next/link";

import { LOCALE_REGISTRY, type Locale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const entry = LOCALE_REGISTRY[locale];
  const { t } = await getDictionary(locale);

  const title = t("offline.title" as never);
  const body = t("offline.body" as never);
  const reload = t("offline.reload" as never);
  const home = t("offline.home" as never);

  const isolated = (value: { text: string; isFallback: boolean }) =>
    value.isFallback && entry.dir === "rtl" ? (
      <span lang="en" dir="ltr">
        {value.text}
      </span>
    ) : (
      value.text
    );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-agro-wheat">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-agro-forest"
          aria-hidden="true"
        >
          <path d="M21 16.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h15.5c1.1 0 2-.9 2-2Z" />
          <path d="M12 12h.01" />
          <path d="M12 16.5c2.21.05 4 1.89 4 4.13v.24a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-.24c0-2.24 1.79-4.09 4-4.13Z" />
          <path d="M7 7h10v2a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V7Z" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-semibold text-agro-ink">
        {isolated(title)}
      </h1>
      <p className="mt-3 max-w-sm leading-relaxed text-agro-slate">
        {isolated(body)}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => typeof window !== "undefined" && window.location.reload()}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-forest px-5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          {isolated(reload)}
        </button>
        <Link
          href={`/${locale === "en" ? "" : locale + "/"}`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-agro-canopy px-5 text-sm font-semibold text-agro-forest transition-colors hover:bg-agro-paper"
        >
          {isolated(home)}
        </Link>
      </div>
    </main>
  );
}
