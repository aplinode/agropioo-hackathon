import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import HiwHero from "./sections/HiwHero";
import SetupFarm from "./sections/SetupFarm";
import AskFlow from "./sections/AskFlow";
import GuidanceEngine from "./sections/GuidanceEngine";
import RecordRemember from "./sections/RecordRemember";
import SeasonLoop from "./sections/SeasonLoop";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("hiw.meta.title").text,
    description: t("hiw.meta.description").text,
  };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale, t } = await getCurrentDictionary((await params).locale);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#journey" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <HiwHero locale={locale} />
        <SetupFarm locale={locale} />
        <AskFlow locale={locale} />
        <GuidanceEngine locale={locale} />
        <RecordRemember locale={locale} />
        <SeasonLoop locale={locale} />
        <CTA locale={locale} />
      </main>

      <Footer hrefPrefix="/" locale={locale} />
    </div>
  );
}
