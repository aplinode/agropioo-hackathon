import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import WhyHero from "./sections/WhyHero";
import Origin from "./sections/Origin";
import Differentiators from "./sections/Differentiators";
import Lifecycle from "./sections/Lifecycle";
import ValueProp from "./sections/ValueProp";
import WhoFor from "./sections/WhoFor";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export const metadata: Metadata = {
  title: "Why Agropioo — AI-Powered Farm Intelligence",
  description:
    "Farming decisions are too important for guesswork. See why Agropioo unites an AI advisor, farm records, weather-aware guidance, and local languages on one Pakistan-first platform.",
};

export default function WhyAgropiooPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#why" />

      <main className="flex flex-1 flex-col">
        <WhyHero />
        <Origin />
        <Differentiators />
        <Lifecycle />
        <ValueProp />
        <WhoFor />
        <CTA />
      </main>

      <Footer hrefPrefix="/" />
    </div>
  );
}
