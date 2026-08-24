import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import FeaturesHero from "./sections/FeaturesHero";
import IntelligenceSuite from "./sections/IntelligenceSuite";
import FieldAndMarket from "./sections/FieldAndMarket";
import VoiceAccess from "./sections/VoiceAccess";
import ManageGrow from "./sections/ManageGrow";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getCurrentDictionary();
  return {
    title: t("feat.meta.title").text,
    description: t("feat.meta.description").text,
  };
}

export default async function FeaturesPage() {
  const { t } = await getCurrentDictionary();
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#features" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <FeaturesHero />
        <IntelligenceSuite />
        <FieldAndMarket />
        <VoiceAccess />
        <ManageGrow />
        <CTA />
      </main>

      <Footer hrefPrefix="/" />
    </div>
  );
}
