import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  DM_Sans,
  Geist_Mono,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Arabic,
} from "next/font/google";

import { LOCALE_REGISTRY } from "@/lib/i18n/config";
import { getAppLocale, getDictionary } from "@/lib/i18n/server";
import "../globals.css";

/* Root layout for the farmer-app route group. Route groups each carry their
   own <html>: marketing pages live under app/(site)/[locale] (URL-driven),
   while this group serves ((dashboard), forgot-password, reset-password,
   onboarding) at bare URLs. The display language comes from the persisted
   agro_locale preference — absent/unknown values resolve to English
   (dashboard-i18n spec FR-1/FR-6); app URLs never carry a language segment. */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Arabic-script faces (lang-compat FR-17). Registered group-wide but their CSS
// variables are only attached to <html> for non-English locales — English
// pages never reference the families, so browsers never fetch the files.
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
  display: "swap",
});

const arabicUi = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic-ui",
  display: "swap",
});

/* Reading cookies makes every farmer route dynamic (dashboard-i18n D1):
   language must be known before <html> is emitted. getAppLocale() resolves
   once per request and is shared with pages under this group. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const { t } = await getDictionary(locale);
  return {
    title: t("app.shell.metadataTitle").text,
    description: t("app.shell.metadataDescription").text,
  };
}

export const viewport: Viewport = {
  themeColor: "#F0FDF4",
};

export default async function FarmerAppLayout({ children }: LayoutProps<"/">) {
  const localeCode = await getAppLocale();
  const entry = LOCALE_REGISTRY[localeCode];
  const isLocalized = localeCode !== "en";

  const fontVariables = isLocalized
    ? `${playfair.variable} ${dmSans.variable} ${geistMono.variable} ${nastaliq.variable} ${arabicUi.variable}`
    : `${playfair.variable} ${dmSans.variable} ${geistMono.variable}`;

  return (
    <html lang={entry.htmlLang} dir={entry.dir} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
