import Image from "next/image";
import logo from "@/references/Agropioo-logo-footer.png";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 6.5h.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4V9h4v1.5A6 6 0 0116 8z" />
      <rect x="2" y="9" width="4" height="12" rx="0.5" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.02l5.75-3.27-5.75-3.27z" />
    </svg>
  );
}

const socials = [
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "X (Twitter)", href: "#", Icon: XIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "YouTube", href: "#", Icon: YoutubeIcon },
];

export default async function Footer({ hrefPrefix = "", locale }: { hrefPrefix?: string; locale: Locale }) {
  const { t } = await getDictionary(locale);
  const sectionHref = (anchor: string) => `${hrefPrefix}${anchor}`;

  const pageLinks = [
    { label: t("nav.whyAgropioo").text, href: "/why-agropioo" },
    { label: t("nav.features").text, href: "/features" },
    { label: t("nav.howItWorks").text, href: "/how-it-works" },
    { label: t("nav.vision").text, href: "/vision" },
    { label: t("nav.getEarlyAccess").text, href: "#get-started" },
  ];

  const legalLinks = [
    { label: t("home.footer.privacy").text, href: "#" },
    { label: t("home.footer.terms").text, href: "#" },
    { label: t("home.footer.cookies").text, href: "#" },
    { label: t("home.footer.disclaimer").text, href: "#" },
  ];

  return (
    <footer className="w-full bg-agro-night px-4 pt-16 pb-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top */}
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <a href={hrefPrefix ? "/" : "#top"} className="inline-flex items-center">
              <Image
                src={logo}
                alt="Agropioo"
                className="h-14 w-auto sm:h-16"
              />
            </a>
            <p className="mt-5 max-w-sm leading-relaxed text-white/70">
              {t("home.footer.tagline").text}
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:bg-agro-canopy hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Pages */}
          <nav className="lg:col-span-2" aria-label={t("home.footer.pagesNavLabel").text}>
            <h3 className="eyebrow text-agro-sprout">{t("home.footer.pagesHeading").text}</h3>
            <ul className="mt-5 space-y-3">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href.startsWith("#") ? sectionHref(link.href) : link.href}
                    className="text-sm text-white/70 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav className="lg:col-span-2" aria-label={t("home.footer.legalNavLabel").text}>
            <h3 className="eyebrow text-agro-sprout">{t("home.footer.legalHeading").text}</h3>
            <ul className="mt-5 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="eyebrow text-agro-sprout">{t("home.footer.contactHeading").text}</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <a
                  href="mailto:hello@agropioo.com"
                  className="transition-colors duration-200 hover:text-white"
                >
                  hello@agropioo.com
                </a>
              </li>
              <li>{t("home.footer.country").text}</li>
              <li>
                <a
                  href="http://aplinode.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white underline-offset-4 transition-colors hover:text-agro-sprout hover:underline"
                >
                  {t("common.productOfAplinode").text}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 pt-8 sm:flex-row">
          <p className="text-sm text-white/60">
            {t("home.footer.copyright", { year: String(new Date().getFullYear()) }).text}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/50">
            {t("home.footer.motto").text}
          </p>
        </div>
      </div>
    </footer>
  );
}
