import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import VisionHero from "./sections/VisionHero";
import Beliefs from "./sections/Beliefs";
import Horizons from "./sections/Horizons";
import Outcomes from "./sections/Outcomes";
import Principles from "./sections/Principles";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("vp.meta.title").text,
    description: t("vp.meta.description").text,
  };
}

export default async function VisionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale, t } = await getCurrentDictionary((await params).locale);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#vision" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <VisionHero locale={locale} />
        <Beliefs locale={locale} />
        <Horizons locale={locale} />
        <Outcomes locale={locale} />
        <Principles locale={locale} />
        <CTA locale={locale} />
      </main>

      <Footer hrefPrefix="/" locale={locale} />
    </div>
  );
}
