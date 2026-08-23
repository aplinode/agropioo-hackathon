import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import FeaturesHero from "./sections/FeaturesHero";
import IntelligenceSuite from "./sections/IntelligenceSuite";
import FieldAndMarket from "./sections/FieldAndMarket";
import VoiceAccess from "./sections/VoiceAccess";
import ManageGrow from "./sections/ManageGrow";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export const metadata: Metadata = {
  title: "Features — Agropioo",
  description:
    "Explore every Agropioo capability: AI crop doctor, satellite NDVI monitoring, mandi price prediction, voice advisory in local languages, offline access with SMS alerts, and more.",
};

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#features" />

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
