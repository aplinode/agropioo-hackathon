import Image from "next/image";
import logo from "@/references/logo.png";

const footerLinks = [
  { label: "Why Agropioo", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#journey" },
  { label: "Vision", href: "#vision" },
  { label: "Get early access", href: "#get-started" },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-agro-forest px-4 pt-16 pb-8 text-white sm:px-6 lg:px-8">
      {/* Furrow contours closing the page */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-agro-sprout/10"
        viewBox="0 0 1440 160"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 50C240 26 480 74 720 52C960 30 1200 70 1440 46" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 104C240 80 480 128 720 106C960 84 1200 124 1440 100" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 border-b border-agro-sprout/20 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <a href="#top" className="flex items-center gap-3">
              <Image
                src={logo}
                alt="Agropioo logo"
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Agropioo
              </span>
            </a>
            <p className="mt-4 max-w-md leading-relaxed text-agro-sprout/85">
              The AI-powered farm intelligence platform. Soil and signal,
              together.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-agro-sprout underline-offset-8 transition-colors hover:text-white hover:underline hover:decoration-agro-leaf hover:decoration-2"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-agro-sprout/75">
            © {new Date().getFullYear()} Agropioo. All rights reserved.
          </p>
          <p className="text-sm text-agro-sprout/75">
            A product of{" "}
            <a
              href="http://aplinode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              Aplinode
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
