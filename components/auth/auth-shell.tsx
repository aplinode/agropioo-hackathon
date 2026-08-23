import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FurrowMotif } from "@/components/FurrowMotif";
import logoOnDark from "@/references/Agropioo-logo-footer.png";
import logoOnLight from "@/references/Agropioo-logo-withoutbg-text.png";

type AuthShellProps = {
  brandHeadline: ReactNode;
  brandPreview: ReactNode;
  brandPoints: string[];
  children: ReactNode;
};

/* Split-panel auth shell shared by the password-recovery screens.
   Mirrors the visual language of /login and /signup: forest brand panel
   with furrow contours on desktop, single column with compact logo header
   under lg. */
export default function AuthShell({
  brandHeadline,
  brandPreview,
  brandPoints,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden gap-14 overflow-hidden bg-agro-forest text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <FurrowMotif
          tone="ghost"
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-agro-sprout/20"
        />
        <svg
          className="drift pointer-events-none absolute -end-40 -top-40 h-[26rem] w-[26rem] text-agro-sprout/15"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
          <circle cx="200" cy="200" r="118" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
        </svg>
        <div className="relative">
          <Link href="/" className="inline-flex items-center">
            <Image src={logoOnDark} alt="Agropioo" className="h-14 w-auto" />
          </Link>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-agro-sprout/80">
            A product of Aplinode
          </p>
        </div>

        <div className="relative max-w-md pb-28 xl:pb-32">
          <h2 className="display-heading font-display text-4xl font-bold leading-[1.25] tracking-tight xl:text-[2.9rem]">
            {brandHeadline}
          </h2>
          {brandPreview}
          <ul className="mt-8 space-y-3">
            {brandPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-white/85">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-canopy"
                  aria-hidden="true"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs uppercase tracking-[0.18em] text-agro-sprout/70">
          Built for Pakistan · Ready for the world
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-white px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex items-center">
            <Image src={logoOnLight} alt="Agropioo" className="h-12 w-auto" />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-10 lg:py-14">{children}</div>
      </main>
    </div>
  );
}
