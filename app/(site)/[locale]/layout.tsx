import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SuggestionChip } from "@/components/suggestion-chip";
import { OfflineProviders } from "@/components/offline/offline-providers";
import { isLocale, LOCALES, LOCALE_REGISTRY } from "@/lib/i18n/config";
import { SetHtmlAttributes } from "@/components/set-html-attributes";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agropioo — AI-Powered Farm Intelligence Platform",
  description:
    "Agropioo unites an AI advisor, market price intelligence, and digital farm records on one platform. Built for Pakistan. A product of Aplinode.",
};

export const viewport: Viewport = {
  themeColor: "#F0FDF4",
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = LOCALE_REGISTRY[rawLocale];
  const isLocalized = locale.code !== "en";

  return (
    <>
      <SetHtmlAttributes lang={locale.htmlLang} dir={locale.dir} />
      {children}
      {!isLocalized && <SuggestionChip />}
      <OfflineProviders locale={locale.code} />
    </>
  );
}
