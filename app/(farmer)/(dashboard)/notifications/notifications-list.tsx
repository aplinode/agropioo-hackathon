"use client";

import { useState } from "react";
import {
  BugIcon,
  CloudRainIcon,
  TrendingUpIcon,
  CheckIcon,
} from "@/components/icons";
import type { AlertKind } from "./notifications-bundle";

const severityChip = {
  critical: "bg-agro-forest text-white",
  warning: "bg-agro-canopy/10 text-agro-canopy",
  info: "bg-agro-mint text-agro-slate",
} as const;

const severityWord = {
  critical: "Critical",
  warning: "Watch",
  info: "Info",
} as const;

const kindIcon: Record<AlertKind, typeof BugIcon> = {
  pest: BugIcon,
  weather: CloudRainIcon,
  price: TrendingUpIcon,
};

export default function NotificationsList() {
  const [allRead, setAllRead] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
          {allRead ? "All caught up" : "0 unread"}
          <span className="sr-only"> notifications</span>
        </p>
        <button
          type="button"
          onClick={() => setAllRead(true)}
          disabled={allRead}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-agro-cloud disabled:no-underline"
        >
          {allRead ? "Nothing unread" : "Mark all as read"}
        </button>
      </div>

      <p className="mt-3 flex items-center gap-3 rounded-2xl border border-agro-sprout bg-agro-mint p-4 text-sm text-agro-slate">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-agro-canopy"
          aria-hidden="true"
        >
          <CheckIcon className="h-5 w-5" />
        </span>
        {"No alerts yet"}
      </p>
    </div>
  );
}
