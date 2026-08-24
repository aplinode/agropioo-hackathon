import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import VisionHero from "./sections/VisionHero";
import Beliefs from "./sections/Beliefs";
import Horizons from "./sections/Horizons";
import Outcomes from "./sections/Outcomes";
import Principles from "./sections/Principles";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getCurrentDictionary();
  return {
    title: t("vp.meta.title").text,
    description: t("vp.meta.description").text,
  };
}

export default async function VisionPage() {
  const { t } = await getCurrentDictionary();
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#vision" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <VisionHero />
        <Beliefs />
        <Horizons />
        <Outcomes />
        <Principles />
        <CTA />
      </main>

      <Footer hrefPrefix="/" />
    </div>
  );
}
