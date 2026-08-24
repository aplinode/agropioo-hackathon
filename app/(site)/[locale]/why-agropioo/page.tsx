import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import WhyHero from "./sections/WhyHero";
import Origin from "./sections/Origin";
import Differentiators from "./sections/Differentiators";
import Lifecycle from "./sections/Lifecycle";
import ValueProp from "./sections/ValueProp";
import WhoFor from "./sections/WhoFor";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getCurrentDictionary();
  return {
    title: t("wy.meta.title").text,
    description: t("wy.meta.description").text,
  };
}

export default async function WhyAgropiooPage() {
  const { t } = await getCurrentDictionary();
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#why" strings={siteHeaderStrings(t)} />

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
