"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "@/references/Agropioo-logo-with-text.png";
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

const navLinks = [
  { label: "Why Agropioo", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#journey" },
  { label: "Vision", href: "#vision" },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

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
          <a href="#top" className="flex items-center">
            <Image
              src={logo}
              alt="Agropioo"
              className="h-12 w-auto md:h-14"
              priority
            />
          </a>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-lg font-medium text-agro-slate underline-offset-8 transition-colors hover:text-agro-canopy hover:underline hover:decoration-agro-sprout hover:decoration-2"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <a
              href="/login"
              className="text-lg font-medium text-agro-slate underline-offset-8 transition-colors hover:text-agro-canopy hover:underline hover:decoration-agro-sprout hover:decoration-2"
            >
              Sign in
            </a>
            <a
              href="#get-started"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-6 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
            >
              Get early access
            </a>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-agro-forest transition-colors hover:bg-agro-mint md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-expanded={mobileMenuOpen}
            aria-haspopup="dialog"
            aria-label="Open menu"
          >
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
          </button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${
          mobileMenuOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen ? true : undefined}
      >
        <div
          className={`absolute inset-0 bg-agro-forest/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`absolute right-0 top-0 flex h-full w-[19rem] max-w-[86vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-agro-clay px-5 py-4">
            <span className="flex items-center">
              <Image
                src={logo}
                alt=""
                className="h-12 w-auto"
              />
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-agro-forest transition-colors hover:bg-agro-mint"
              aria-label="Close menu"
            >
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
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Sidebar">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-xl px-4 py-3.5 text-lg font-medium text-agro-ink transition-colors hover:bg-agro-mint hover:text-agro-canopy"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-agro-clay p-4">
            <a
              href="#get-started"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-agro-canopy px-5 text-base font-semibold text-white transition-colors hover:bg-agro-forest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get early access
            </a>
            <a
              href="/login"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg px-5 text-base font-medium text-agro-canopy transition-colors hover:bg-agro-mint"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </a>
            <p className="mt-3 text-center font-mono text-xs tracking-wide text-agro-slate">
              Built for Pakistan · A product of Aplinode
            </p>
          </div>
        </aside>
      </div>

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
