import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import FeaturesHero from "./sections/FeaturesHero";
import IntelligenceSuite from "./sections/IntelligenceSuite";
import FieldAndMarket from "./sections/FieldAndMarket";
import VoiceAccess from "./sections/VoiceAccess";
import ManageGrow from "./sections/ManageGrow";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("feat.meta.title").text,
    description: t("feat.meta.description").text,
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale, t } = await getCurrentDictionary((await params).locale);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#features" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <FeaturesHero locale={locale} />
        <IntelligenceSuite locale={locale} />
        <FieldAndMarket locale={locale} />
        <VoiceAccess locale={locale} />
        <ManageGrow locale={locale} />
        <CTA locale={locale} />
      </main>

      <Footer hrefPrefix="/" locale={locale} />
    </div>
  );
}
