"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CameraIcon,
  ChatIcon,
  GearIcon,
  HomeIcon,
  LeafIcon,
  LogOutIcon,
  SproutIcon,
  TagIcon,
} from "@/components/icons";
import logoOnDark from "@/references/Agropioo-logo-footer.png";
import type { ShellBundle } from "./shell-bundle";

/* Desktop (≥lg) sidebar for the farmer app: a dark forest ledger rail.
   The farmer app carries its own identity here — marketing pages keep
   their white chrome; inside the app, greens go deep. */

interface AppSidebarProps {
  bundle: ShellBundle;
}

export default function AppSidebar({ bundle }: AppSidebarProps) {
  const pathname = usePathname();
  const { nav, signOut, aria, productOf, builtForPakistan } = bundle;

  const destinations = [
    { href: "/dashboard", label: nav.dashboard, Icon: HomeIcon },
    { href: "/farms", label: nav.farms, Icon: LeafIcon },
    { href: "/advisor", label: nav.advisor, Icon: ChatIcon },
    { href: "/detect", label: nav.detect, Icon: CameraIcon },
    { href: "/prices", label: nav.prices, Icon: TagIcon },
    { href: "/notifications", label: nav.notifications, Icon: BellIcon },
    { href: "/settings", label: nav.settings, Icon: GearIcon },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col justify-between overflow-y-auto bg-agro-forest px-4 py-6 text-white lg:flex">
      <div>
        <Link href="/" className="inline-flex items-center px-2">
          <Image src={logoOnDark} alt="Agropioo" className="h-11 w-auto" />
        </Link>
        <p className="mt-1 px-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-white/50">
          {productOf}
        </p>

        <nav aria-label={aria.farmerTools} className="mt-8">
          <ul className="space-y-1">
            {destinations.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-white/10 font-semibold text-white"
                        : "font-medium text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute start-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-e-full bg-agro-sprout"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={`h-5 w-5 shrink-0 ${active ? "text-agro-sprout" : "text-white/45"}`}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="space-y-3">
        <Link
          href="/login"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          {signOut}
        </Link>
        <p className="flex items-center gap-2 px-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/40">
          <SproutIcon size={14} className="shrink-0 text-agro-sprout/60" aria-hidden="true" />
          {builtForPakistan}
        </p>
      </div>
    </aside>
  );
}
