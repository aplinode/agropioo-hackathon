"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import logo from "@/references/Agropioo-logo-with-text.png";
import { splitLocalePrefix } from "@/lib/i18n/logic";

import { LanguageSwitcher } from "./language-switcher";

export interface SiteHeaderStrings {
  whyAgropioo: string;
  features: string;
  howItWorks: string;
  vision: string;
  signIn: string;
  signUp: string;
  getEarlyAccess: string;
  openMenu: string;
  closeMenu: string;
  languageSwitcher: string;
  dashboard?: string;
}

export interface SessionUser {
  email: string;
  fullName: string;
}

export default function SiteHeader({
  linkBase = "",
  activeSection,
  strings,
  session,
}: {
  linkBase?: string;
  activeSection?: string;
  strings: SiteHeaderStrings;
  session?: SessionUser | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() || "";

  const { locale } = splitLocalePrefix(pathname);
  const prefix = locale ? `/${locale}` : "";

  const initials = session?.fullName
    ? session.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

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

  const sections = [
    { label: strings.whyAgropioo, anchor: "#why", selfHref: "/why-agropioo" },
    { label: strings.features, anchor: "#features", selfHref: "/features" },
    { label: strings.howItWorks, anchor: "#journey", selfHref: "/how-it-works" },
    { label: strings.vision, anchor: "#vision", selfHref: "/vision" },
  ];

  const navLinks = sections.map((section) => ({
    label: section.label,
    href: section.selfHref ? `${prefix}${section.selfHref}` : `${prefix}${linkBase}${section.anchor}`,
    active: activeSection === section.anchor,
  }));

  const ctaHref = `${prefix}${linkBase}#get-started`;
  const homeHref = prefix ? prefix : linkBase ? "/" : "#top";

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled || mobileMenuOpen
            ? "border-b border-agro-clay bg-white/90 backdrop-blur-md"
            : "border-b border-transparent bg-white/60 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center">
            <Image
              src={logo}
              alt="Agropioo"
              className="h-12 w-auto md:h-14"
              priority
              loading="eager"
            />
          </Link>

          <nav className="hidden items-center gap-6 xl:gap-9 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={`text-lg font-medium underline-offset-8 transition-colors hover:text-agro-canopy hover:underline hover:decoration-agro-sprout hover:decoration-2 ${
                  link.active
                    ? "font-semibold text-agro-canopy decoration-agro-sprout decoration-2 underline"
                    : "text-agro-slate"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:gap-4 lg:flex">
            <LanguageSwitcher label={strings.languageSwitcher} />
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-agro-canopy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {initials}
                </span>
                {strings.dashboard ?? "Dashboard"}
              </Link>
            ) : (
              <>
                <Link
                  href={`${prefix}/login`}
                  className="text-lg font-medium text-agro-slate underline-offset-8 transition-colors hover:text-agro-canopy hover:underline hover:decoration-agro-sprout hover:decoration-2"
                >
                  {strings.signIn}
                </Link>
                <Link
                  href={`${prefix}/signup`}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-agro-sprout bg-white px-6 text-base font-semibold whitespace-nowrap text-agro-forest shadow-sm transition-all duration-200 hover:border-agro-canopy hover:bg-agro-mint"
                >
                  {strings.signUp}
                </Link>
                <Link
                  href={ctaHref}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-6 text-base font-semibold whitespace-nowrap text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
                >
                  {strings.getEarlyAccess}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher label={strings.languageSwitcher} />
            <button
              type="button"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-agro-forest transition-colors hover:bg-agro-mint"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-haspopup="dialog"
              aria-label={strings.openMenu}
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
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
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
          className={`absolute end-0 top-0 flex h-full w-[19rem] max-w-[86vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
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
              aria-label={strings.closeMenu}
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
              <Link
                key={link.label}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={`rounded-xl px-4 py-3.5 text-lg font-medium transition-colors hover:bg-agro-mint hover:text-agro-canopy ${
                  link.active ? "bg-agro-mint font-semibold text-agro-canopy" : "text-agro-ink"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-agro-clay p-4">
            {session ? (
              <>
                <div className="mb-3 rounded-xl bg-agro-mint px-4 py-3">
                  <p className="text-sm font-semibold text-agro-forest">{session.fullName}</p>
                  <p className="text-xs text-agro-slate">{session.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-agro-canopy px-5 text-base font-semibold text-white transition-colors hover:bg-agro-forest"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {strings.dashboard ?? "Dashboard"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={ctaHref}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-agro-canopy px-5 text-base font-semibold text-white transition-colors hover:bg-agro-forest"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {strings.getEarlyAccess}
                </Link>
                <Link
                  href={`${prefix}/signup`}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg border border-agro-sprout bg-white px-5 text-base font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {strings.signUp}
                </Link>
                <Link
                  href={`${prefix}/login`}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg px-5 text-base font-medium text-agro-canopy transition-colors hover:bg-agro-mint"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {strings.signIn}
                </Link>
              </>
            )}
            <p className="mt-3 text-center font-mono text-xs tracking-wide text-agro-slate">
              Built for Pakistan · A product of Aplinode
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
