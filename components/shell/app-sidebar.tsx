"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CameraIcon,
  ChatIcon,
  DocumentIcon,
  GearIcon,
  HomeIcon,
  LeafIcon,
  LogOutIcon,
  TagIcon,
} from "@/components/icons";
import logoOnLight from "@/references/Agropioo-logo-withoutbg-text.png";

/* Desktop (≥lg) sidebar for the farmer app: logo, every tool, sign-out. */
const destinations = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/farms", label: "Farms", Icon: LeafIcon },
  { href: "/advisor", label: "Advisor", Icon: ChatIcon },
  { href: "/detect", label: "Detect", Icon: CameraIcon },
  { href: "/prices", label: "Prices", Icon: TagIcon },
  { href: "/schemes", label: "Schemes", Icon: DocumentIcon },
  { href: "/notifications", label: "Notifications", Icon: BellIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export default function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between overflow-y-auto border-r border-agro-sprout bg-white px-4 py-6 lg:flex">
      <div>
        <Link href="/" className="inline-flex items-center px-2">
          <Image src={logoOnLight} alt="Agropioo" className="h-11 w-auto" />
        </Link>
        <p className="mt-1 px-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-agro-cloud">
          A product of Aplinode
        </p>

        <nav aria-label="Farmer tools" className="mt-8">
          <ul className="space-y-1">
            {destinations.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-agro-mint text-agro-canopy"
                        : "text-agro-slate hover:bg-agro-stone hover:text-agro-ink"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-agro-canopy" : "text-agro-leaf"}`} />
                    {label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-agro-canopy" aria-hidden="true" />
                    )}
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
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-agro-slate transition-colors hover:bg-agro-stone hover:text-agro-error"
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          Sign out
        </Link>
        <p className="px-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-cloud">
          Built for Pakistan
        </p>
      </div>
    </aside>
  );
}
