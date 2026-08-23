"use client";

import { useState } from "react";
import {
  BugIcon,
  CloudRainIcon,
  TrendingUpIcon,
} from "@/components/icons";
import {
  demoNotifications,
  type AlertKind,
} from "./demo-data";

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

/* Alerts center: every notification with severity styling that matches the
   dashboard's green-intensity ladder. Marking all read is session-only
   (no backend is wired). */
export default function NotificationsList() {
  const [allRead, setAllRead] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
          {allRead ? "All caught up" : `${demoNotifications.length} unread`}
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

      <ul className="mt-3 divide-y divide-agro-clay overflow-hidden rounded-2xl border border-agro-clay bg-white">
        {demoNotifications.map((item) => {
          const KindIcon = kindIcon[item.kind];
          const read = allRead;
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 p-4 transition-opacity ${
                read ? "opacity-55" : ""
              }`}
            >
              {!read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-agro-canopy" aria-hidden="true" />
              )}
              <span
                aria-hidden="true"
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityChip[item.severity]} ${!read ? "" : ""}`}
              >
                <KindIcon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <span className={`sr-only`}>{severityWord[item.severity]} alert. </span>
                <p
                  className={`text-sm leading-snug text-agro-ink ${
                    read ? "font-normal" : "font-medium"
                  }`}
                >
                  {item.message}
                </p>
              </div>
              <span className="hidden shrink-0 font-mono text-xs text-agro-cloud sm:block">
                {item.relativeTime}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 rounded-xl border border-dashed border-agro-cloud/70 bg-agro-stone px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        DEMO · marking read lasts for this visit only
      </p>
    </div>
  );
}
