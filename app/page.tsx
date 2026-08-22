"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/references/logo.png";
import Hero from "./sections/Hero";
import Problem from "./sections/Problem";
import Solution from "./sections/Solution";
import CoreFeatures from "./sections/CoreFeatures";
import FeatureMatrix from "./sections/FeatureMatrix";
import FarmerJourney from "./sections/FarmerJourney";
import Vision from "./sections/Vision";
import TargetUsers from "./sections/TargetUsers";
import CTA from "./sections/CTA";
import Footer from "./sections/Footer";

const navLinks = [
  { label: "Why Agropioo", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#journey" },
  { label: "Vision", href: "#vision" },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Navigation */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled || mobileMenuOpen
            ? "border-b border-agro-clay bg-white/90 backdrop-blur-md"
            : "border-b border-transparent bg-white/60 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <Image
              src={logo}
              alt="Agropioo logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="font-display text-xl font-semibold tracking-tight text-agro-forest">
              Agropioo
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-agro-slate underline-offset-8 transition-colors hover:text-agro-canopy hover:underline hover:decoration-agro-sprout hover:decoration-2"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <a
              href="#get-started"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
            >
              Get early access
            </a>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-agro-forest transition-colors hover:bg-agro-mint md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-agro-clay bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#get-started"
                className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get early access
              </a>
            </nav>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        <Hero />
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
