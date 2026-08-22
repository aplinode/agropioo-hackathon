"use client";

import SiteHeader from "@/components/SiteHeader";
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Hero />
        <CapabilityTicker />
        <Problem />
        <Solution />
        <CoreFeatures />
        <FeatureMatrix />
        <FarmerJourney />
        <Vision />
        <TargetUsers />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
