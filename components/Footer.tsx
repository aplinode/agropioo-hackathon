import { Logo } from "./Logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pakistan-first", label: "Pakistan first" },
  { href: "#early-access", label: "Early access" },
];

export function Footer() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-agro-slate">
              Soil and signal — intelligent agriculture, beginning in Pakistan.
            </p>
            <p className="mt-3 text-sm text-agro-slate">
              A product of{" "}
              <a
                href="http://aplinode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-agro-canopy underline decoration-agro-sprout underline-offset-4 transition-colors hover:decoration-agro-canopy"
              >
                Aplinode
              </a>
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-agro-slate transition-colors hover:text-agro-canopy"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-agro-sprout/60 pt-6 text-xs text-agro-slate sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Aplinode. Agropioo is a product of Aplinode.</p>
          <p>Made for farmers.</p>
        </div>
      </div>
    </footer>
  );
}
