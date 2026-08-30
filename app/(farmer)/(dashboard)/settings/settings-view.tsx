"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BugIcon,
  CloudRainIcon,
  GlobeIcon,
  LogOutIcon,
  TrendingUpIcon,
} from "@/components/icons";

const languages = [
  { name: "English", code: "EN", available: true },
  { name: "اردو · Urdu", code: "UR", available: false },
  { name: "پنجابی · Punjabi", code: "PA", available: false },
  { name: "پشتو · Pashto", code: "PS", available: false },
  { name: "سنڌي · Sindhi", code: "SD", available: false },
] as const;

/* Profile & preferences (UI-only demo). Toggles and language selection
   are session-only until preferences are wired to the database. */
export default function SettingsView() {
  const [alertsOn, setAlertsOn] = useState({
    weather: true,
    pest: true,
    prices: false,
  });

  function toggle(key: keyof typeof alertsOn) {
    setAlertsOn((current) => ({ ...current, [key]: !current[key] }));
  }

  const alertRows = [
    {
      key: "weather" as const,
      label: "Weather warnings",
      description: "Rain, heat, and frost calls for your farms",
      Icon: CloudRainIcon,
    },
    {
      key: "pest" as const,
      label: "Pest outbreaks",
      description: "District-level risk alerts like whitefly weeks",
      Icon: BugIcon,
    },
    {
      key: "prices" as const,
      label: "Price spikes",
      description: "When a crop you grow moves sharply at mandi",
      Icon: TrendingUpIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section aria-labelledby="profile-heading">
        <h2
          id="profile-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Profile
        </h2>
        <div className="mt-3 rounded-2xl border border-agro-sprout bg-white p-5">
          <div className="flex items-center gap-4">
            <span
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-agro-canopy font-semibold text-white"
              aria-hidden="true"
            >
              MA
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-agro-forest">
                Muhammad Ahmad
              </p>
              <p className="font-mono text-xs tracking-wide text-agro-slate">
                +92 3•• ••• 421 · a***@gmail.com
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-agro-mint px-3.5 py-2.5 text-sm leading-relaxed text-agro-slate">
            <span
              className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-agro-success"
              aria-hidden="true"
            />
            3 farms linked · Multan district
          </p>
        </div>
      </section>

      {/* Language */}
      <section aria-labelledby="language-heading">
        <h2
          id="language-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Language
        </h2>
        <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
          {languages.map((language) => (
            <li
              key={language.code}
              className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5"
              aria-current={language.available ? "true" : undefined}
            >
              <span
                className={`text-sm ${
                  language.available
                    ? "font-semibold text-agro-ink"
                    : "text-agro-slate"
                }`}
              >
                {language.name}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold ${
                  language.available
                    ? "bg-agro-mint text-agro-canopy"
                    : "border border-agro-sprout bg-white text-agro-slate"
                }`}
              >
                {language.available ? language.code : "Soon"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-agro-slate">
          <GlobeIcon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Local languages roll out one by one — Urdu first.
        </p>
      </section>

      {/* Notification preferences */}
      <section aria-labelledby="alerts-heading">
        <h2
          id="alerts-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Alerts
        </h2>
        <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
          {alertRows.map(({ key, label, description, Icon }) => (
            <li key={key} className="flex items-center gap-3 px-4 py-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-agro-ink">{label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-agro-slate">
                  {description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={alertsOn[key]}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                  alertsOn[key] ? "bg-agro-canopy" : "bg-agro-sprout"
                }`}
              >
                <span className="sr-only">
                  {alertsOn[key] ? `Turn off ${label}` : `Turn on ${label}`}
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    alertsOn[key] ? "start-7" : "start-1"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sign out */}
      <Link
        href="/login"
        className="flex min-h-12 items-center gap-3 rounded-2xl border border-agro-sprout bg-white px-5 text-sm font-semibold text-agro-ink transition-colors hover:border-agro-canopy/40 hover:bg-agro-mint"
      >
        <LogOutIcon size={18} className="shrink-0" />
        Sign out
      </Link>
    </div>
  );
}
