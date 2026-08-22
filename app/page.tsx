"use client";

import Image from "next/image";
import { useState } from "react";
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
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <Image
              src={logo}
              alt="Agropioo logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="text-xl font-bold text-agro-forest">
              Agropioo
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-agro-slate transition-colors hover:text-agro-canopy"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href="#"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-agro-forest md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="border-t border-agro-sprout bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base font-medium text-agro-slate transition-colors hover:text-agro-canopy"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#"
                className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
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
