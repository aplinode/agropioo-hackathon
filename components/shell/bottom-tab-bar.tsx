"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CameraIcon,
  ChatIcon,
  GridIcon,
  HomeIcon,
  LeafIcon,
} from "@/components/icons";

/* Mobile bottom tab bar — exactly five tabs per the dashboard spec.
   Active tab gets a solid canopy chip: unmistakable in outdoor light. */
const tabs = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/farms", label: "Farms", Icon: LeafIcon },
  { href: "/advisor", label: "Advisor", Icon: ChatIcon },
  { href: "/detect", label: "Detect", Icon: CameraIcon },
  { href: "/more", label: "More", Icon: GridIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Farmer tools"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-agro-sprout bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.7rem] transition-colors ${
                  active ? "font-semibold text-agro-forest" : "font-medium text-agro-slate"
                }`}
              >
                {active && (
                  <span
                    className="absolute top-0 h-0.5 w-10 rounded-full bg-agro-canopy"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-agro-canopy text-white" : ""
                  }`}
                >
                  <Icon size={18} />
                </span>
                {label}
                <span className="sr-only">{active ? " (current page)" : ""}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
