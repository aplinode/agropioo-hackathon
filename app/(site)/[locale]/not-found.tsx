import Link from "next/link";
import { cookies } from "next/headers";

import { isLocale, LOCALE_REGISTRY, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LocaleNotFound() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("agro_locale")?.value ?? "";
  const locale: Locale = isLocale(raw) ? raw : "en";
  const { t } = await getDictionary(locale);
  const dir = LOCALE_REGISTRY[locale].dir;

  const title = t("notFound.title");
  const body = t("notFound.body");
  const backHome = t("notFound.backHome");

  // English fallbacks render isolated so they cannot corrupt RTL bidi order (FR-12).
  const isolated = (value: string, isFallback: boolean) =>
    isFallback && dir === "rtl" ? (
      <span lang="en" dir="ltr">
        {value}
      </span>
    ) : (
      value
    );

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="eyebrow text-agro-canopy">404</p>
      <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink">
        {isolated(title.text, title.isFallback)}
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
        {isolated(body.text, body.isFallback)}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-agro-canopy px-6 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
      >
        {isolated(backHome.text, backHome.isFallback)}
      </Link>
    </main>
  );
}
