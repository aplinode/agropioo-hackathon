import SiteHeader from "@/components/SiteHeader";
import type { SiteHeaderStrings, SessionUser } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n/config";
import Hero from "./sections/Hero";
import CapabilityTicker from "./sections/CapabilityTicker";
import Problem from "./sections/Problem";
import Solution from "./sections/Solution";
import CoreFeatures from "./sections/CoreFeatures";
import FeatureMatrix from "./sections/FeatureMatrix";
import FarmerJourney from "./sections/FarmerJourney";
import Vision from "./sections/Vision";
import TargetUsers from "./sections/TargetUsers";
import CTA from "./sections/CTA";
import Footer from "./sections/Footer";

export default function HomeContent({
  headerStrings,
  session,
  locale,
}: {
  headerStrings: SiteHeaderStrings;
  session?: SessionUser | null;
  locale: Locale;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader strings={headerStrings} session={session} />

      <main className="flex flex-1 flex-col">
        <Hero locale={locale} />
        <CapabilityTicker locale={locale} />
        <Problem locale={locale} />
        <Solution locale={locale} />
        <CoreFeatures locale={locale} />
        <FeatureMatrix locale={locale} />
        <FarmerJourney locale={locale} />
        <Vision locale={locale} />
        <TargetUsers locale={locale} />
        <CTA locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
