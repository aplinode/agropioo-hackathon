"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { CloseIcon, MenuIcon } from "./icons";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled || open
          ? "border-b border-agro-sprout/60 bg-agro-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          aria-label="Agropioo — back to top"
          className="whitespace-nowrap"
        >
          <Logo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-agro-slate transition-colors hover:text-agro-canopy"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#early-access"
            className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-agro-wheat px-5 text-sm font-semibold text-agro-forest transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
          >
            Get early access
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-agro-forest transition-colors hover:bg-agro-mint md:hidden"
        >
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="mx-4 mb-4 rounded-2xl border border-agro-sprout/70 bg-agro-paper p-3 shadow-lg md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-4 text-base font-medium text-agro-ink transition-colors hover:bg-agro-mint"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#early-access"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-agro-wheat px-5 text-sm font-semibold text-agro-forest transition-all duration-200 hover:-translate-y-px active:translate-y-0"
            >
              Get early access
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
