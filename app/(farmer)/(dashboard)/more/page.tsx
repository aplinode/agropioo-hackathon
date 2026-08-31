import type { Metadata } from "next";
import Link from "next/link";
import {
  BellIcon,
  CameraIcon,
  ChatIcon,
  ChevronRightIcon,
  CloudRainIcon,
  GearIcon,
  LeafIcon,
  TagIcon,
  WheatIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "More tools — Agropioo",
};

const primaryTools = [
  { href: "/farms", label: "Farms", description: "Your farms and records", Icon: LeafIcon },
  { href: "/advisor", label: "Advisor", description: "Ask about your crop", Icon: ChatIcon },
  { href: "/detect", label: "Detect", description: "Scan a sick leaf", Icon: CameraIcon },
  { href: "/crops", label: "Crops", description: "Get crop recommendations", Icon: WheatIcon },
];

const otherTools = [
  { href: "/prices", label: "Prices", Icon: TagIcon },
  { href: "/weather", label: "Weather", Icon: CloudRainIcon },
  { href: "/notifications", label: "Notifications", Icon: BellIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

/* Mobile "More" surface: every farmer tool that doesn't fit the
   bottom tab bar, reachable in one tap. */
export default function MorePage() {
  return (
    <div className="pt-1">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
        All tools
      </p>
      <h1 className="display-heading mt-2 font-display text-3xl font-semibold tracking-tight text-agro-forest sm:text-4xl">
        More tools
      </h1>

      <ul className="mt-6 space-y-3">
        {primaryTools.map(({ href, label, description, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-16 items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-agro-ink">{label}</span>
                <span className="block truncate text-xs text-agro-slate">{description}</span>
              </span>
              <ChevronRightIcon
                className="h-4 w-4 shrink-0 text-agro-slate transition-colors duration-200 group-hover:text-agro-canopy"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="more-secondary" className="mt-8">
        <h2
          id="more-secondary"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Also for you
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {otherTools.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-agro-sprout bg-white p-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium leading-tight text-agro-ink">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
