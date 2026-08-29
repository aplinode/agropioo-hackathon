import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import WhyHero from "./sections/WhyHero";
import Origin from "./sections/Origin";
import Differentiators from "./sections/Differentiators";
import Lifecycle from "./sections/Lifecycle";
import ValueProp from "./sections/ValueProp";
import WhoFor from "./sections/WhoFor";
import CTA from "../sections/CTA";
import Footer from "../sections/Footer";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("wy.meta.title").text,
    description: t("wy.meta.description").text,
  };
}

export default async function WhyAgropiooPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale, t } = await getCurrentDictionary((await params).locale);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader linkBase="/" activeSection="#why" strings={siteHeaderStrings(t)} />

      <main className="flex flex-1 flex-col">
        <WhyHero locale={locale} />
        <Origin locale={locale} />
        <Differentiators locale={locale} />
        <Lifecycle locale={locale} />
        <ValueProp locale={locale} />
        <WhoFor locale={locale} />
        <CTA locale={locale} />
      </main>

      <Footer hrefPrefix="/" locale={locale} />
    </div>
  );
}
