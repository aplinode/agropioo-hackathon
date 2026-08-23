import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import HiwHero from "./sections/HiwHero";
import SetupFarm from "./sections/SetupFarm";
import AskFlow from "./sections/AskFlow";
import GuidanceEngine from "./sections/GuidanceEngine";
import RecordRemember from "./sections/RecordRemember";
import SeasonLoop from "./sections/SeasonLoop";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export const metadata: Metadata = {
  title: "How it works — Agropioo",
  description:
    "From a one-minute farm profile to a season loop that keeps improving: see how Agropioo turns questions, activity, and records into personalised farming guidance.",
};

export default async function HowItWorksPage() {
  const { t } = await getCurrentDictionary();
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#journey" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <HiwHero />
        <SetupFarm />
        <AskFlow />
        <GuidanceEngine />
        <RecordRemember />
        <SeasonLoop />
        <CTA />
      </main>

      <Footer hrefPrefix="/" />
    </div>
  );
}
