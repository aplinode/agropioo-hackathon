import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  DM_Sans,
  Geist_Mono,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Arabic,
} from "next/font/google";
import { notFound } from "next/navigation";
import { SuggestionChip } from "@/components/suggestion-chip";
import { isLocale, LOCALES, LOCALE_REGISTRY } from "@/lib/i18n/config";
import "../../globals.css";

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

// Arabic-script faces (FR-17). Registered site-wide but their CSS variables are
// only attached to <html> for non-English locales — English pages never
// reference the families, so browsers never fetch the font files.
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

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Pages read live copy from the translations table; rendering dynamically keeps
// founder SQL edits visible on the very next request (spec AC-6). Revisit with
// admin-triggered revalidation if traffic ever demands caching.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agropioo — AI-Powered Farm Intelligence Platform",
  description:
    "Agropioo unites an AI advisor, satellite field monitoring, market price intelligence, and digital farm records on one platform. Built for Pakistan. A product of Aplinode.",
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

  const fontVariables = isLocalized
    ? `${playfair.variable} ${dmSans.variable} ${geistMono.variable} ${nastaliq.variable} ${arabicUi.variable}`
    : `${playfair.variable} ${dmSans.variable} ${geistMono.variable}`;

  return (
    <html lang={locale.htmlLang} dir={locale.dir} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        {!isLocalized && <SuggestionChip />}
      </body>
    </html>
  );
}
