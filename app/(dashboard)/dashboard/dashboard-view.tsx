"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BugIcon,
  CameraIcon,
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CloudRainIcon,
  GlobeIcon,
  BellIcon,
  LeafIcon,
  PlusIcon,
  TagIcon,
  TrendingUpIcon,
  XIcon,
} from "@/components/icons";
import {
  checklistItems,
  demoAdvisory,
  demoAlerts,
  demoFarmer,
  demoFarms,
  demoSeasonTip,
  demoWeather,
  quickActions,
} from "./demo-data";

const CHECKLIST_DISMISS_KEY = "agropioo-checklist-dismissed";

/* Session-scoped store so checklist dismissal survives navigation
   without per-component state syncing effects. */
const checklistStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  getSnapshot(): boolean {
    try {
      return window.sessionStorage.getItem(CHECKLIST_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  },
  getServerSnapshot(): boolean {
    return false;
  },
  dismiss() {
    try {
      window.sessionStorage.setItem(CHECKLIST_DISMISS_KEY, "1");
    } catch {
      // Storage unavailable — dismissal holds for this view only.
    }
    for (const listener of this.listeners) listener();
  },
};

/* Severity tints for alert rows — small icon accents, never gold surfaces
   (the Detect CTA below is this page's single --agro-wheat surface). */
const severityTint = {
  critical: "bg-agro-error/10 text-agro-error",
  warning: "bg-agro-warning/15 text-agro-earth",
  info: "bg-agro-info/10 text-agro-info",
} as const;

const alertKindIcon = {
  pest: BugIcon,
  weather: CloudRainIcon,
  price: TrendingUpIcon,
} as const;

const quickActionIcon = {
  clipboard: ClipboardIcon,
  chat: ChatIcon,
  camera: CameraIcon,
  tag: TagIcon,
} as const;

function Eyebrow({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p
      {...(id ? { id } : {})}
      className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-slate"
    >
      {children}
    </p>
  );
}

type DashboardViewProps = {
  variant: "default" | "empty";
};

/* Farmer home screen — answers "kya karoon aaj?" in one scan.
   UI-only demo build; all content comes from typed mock data.
   Visual language: greens dominate (forest hero, mint fills), paper cards,
   editorial mono labels, ONE harvest-gold surface (Detect CTA). */
export default function DashboardView({ variant }: DashboardViewProps) {
  const isEmpty = variant === "empty";
  const checklistDismissed = useSyncExternalStore(
    checklistStore.subscribe.bind(checklistStore),
    checklistStore.getSnapshot,
    checklistStore.getServerSnapshot
  );

  const completedCount = isEmpty ? 0 : 1;
  const advisory = isEmpty ? demoSeasonTip : demoAdvisory;
  const topAlerts = demoAlerts.slice(0, 3);

  return (
    <div className="relative">
      {/* Soft mint wash fading into paper — the page breathes like the landing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-5 h-80 bg-gradient-to-b from-agro-mint to-transparent"
      />

      <div className="relative space-y-7 pt-1">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="display-heading font-display text-[1.7rem] font-bold leading-tight tracking-tight text-agro-forest sm:text-4xl">
              Assalam-o-Alaikum, {demoFarmer.firstName}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-agro-slate">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-agro-leaf"
                aria-hidden="true"
              />
              {demoFarmer.location}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/notifications"
              aria-label={`Notifications, ${demoFarmer.unreadCount} unread`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-agro-sprout bg-white text-agro-slate transition-colors hover:border-agro-canopy hover:text-agro-canopy"
            >
              <BellIcon className="h-5 w-5" />
              {demoFarmer.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agro-error px-1 font-mono text-[0.65rem] font-semibold leading-none text-white ring-2 ring-white">
                  {demoFarmer.unreadCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              title="Language switching coming soon"
              aria-label="Change language (coming soon)"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-agro-sprout bg-white px-3 font-mono text-sm font-semibold text-agro-slate transition-colors hover:border-agro-canopy hover:text-agro-canopy"
            >
              <GlobeIcon className="h-4 w-4" />
              EN
            </button>
            <Link
              href="/settings"
              aria-label="Your profile and settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-agro-canopy font-semibold text-white transition-colors hover:bg-agro-forest"
            >
              {demoFarmer.initials}
            </Link>
          </div>
        </header>

        {/* Empty-state welcome hero — the forest panel greets first-run farmers */}
        {isEmpty && (
          <section
            aria-labelledby="welcome-hero"
            className="relative overflow-hidden rounded-3xl bg-agro-forest p-6 text-white sm:p-8"
          >
            <svg
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 text-agro-sprout/15"
              viewBox="0 0 400 400"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
              <circle cx="200" cy="200" r="118" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
            </svg>
            <p className="relative font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-sprout">
              Welcome to Agropioo
            </p>
            <h2
              id="welcome-hero"
              className="display-heading relative mt-3 max-w-md font-display text-2xl font-bold leading-snug sm:text-3xl"
            >
              Start With Your First Farm.
            </h2>
            <p className="relative mt-2 max-w-md text-sm leading-relaxed text-agro-sprout/90">
              Your crop, your soil, your weather — every advisory will be shaped
              around them once your farm is in.
            </p>
            <Link
              href="/farms/new"
              className="relative mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <PlusIcon className="h-4 w-4" />
              Add your first farm
            </Link>
          </section>
        )}

        {/* Today's advisory (forest hero) + weather */}
        <div className="grid gap-4 lg:grid-cols-5">
          <section
            aria-labelledby="advisory-heading"
            className="relative overflow-hidden rounded-3xl bg-agro-forest p-6 text-white lg:col-span-3"
          >
            <svg
              className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 text-agro-sprout/15"
              viewBox="0 0 400 400"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
              <circle cx="200" cy="200" r="118" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
              <circle cx="330" cy="70" r="5" fill="var(--color-agro-sprout)" opacity="0.35" stroke="none" />
            </svg>
            <div className="relative flex flex-wrap items-center gap-2">
              {isEmpty ? (
                <span className="rounded-full border border-agro-sprout/40 bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
                  Season tip
                </span>
              ) : (
                <>
                  <span className="rounded-full border border-agro-sprout/40 bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
                    {demoAdvisory.crop}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                    {demoAdvisory.stage}
                  </span>
                </>
              )}
              <span className="ml-auto font-mono text-xs uppercase tracking-wide text-agro-sprout/80">
                Today
              </span>
            </div>
            <h2 id="advisory-heading" className="sr-only">
              Today&apos;s advisory
            </h2>
            <p className="relative mt-4 max-w-md text-xl font-bold leading-snug sm:text-[1.35rem]">
              {advisory.action}
            </p>
            <p className="relative mt-2 max-w-md text-sm leading-relaxed text-agro-sprout/90">
              {advisory.why}
            </p>
            <Link
              href="/advisor"
              className="relative mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-leaf"
            >
              Ask the advisor
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </section>

          <section
            aria-labelledby="weather-heading"
            className="flex flex-col rounded-3xl border border-agro-sprout bg-white p-6 lg:col-span-2"
          >
            <Eyebrow id="weather-heading">Weather · {demoWeather.location}</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-agro-ink">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-agro-info/10 text-agro-info">
                    <CloudRainIcon className="h-5 w-5" />
                  </span>
                  {demoWeather.condition}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-agro-stone px-2 py-1 font-mono text-xs text-agro-slate">
                    H {demoWeather.highC}°
                  </span>
                  <span className="rounded-md bg-agro-stone px-2 py-1 font-mono text-xs text-agro-slate">
                    L {demoWeather.lowC}°
                  </span>
                </div>
              </div>
              <p className="font-mono text-[2.6rem] font-bold leading-none text-agro-forest">
                {demoWeather.temperatureC}°
              </p>
            </div>
            <p className="mt-4 rounded-lg bg-agro-mint px-3 py-2 text-xs leading-relaxed text-agro-slate">
              {demoWeather.rainNote}
            </p>
            <Link
              href="/weather"
              className="mt-auto inline-flex min-h-11 items-center gap-1 pt-3 text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
            >
              Full forecast
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </section>
        </div>

        {/* Alerts strip */}
        <section aria-labelledby="alerts-heading">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow id="alerts-heading">Alerts · {isEmpty ? 0 : demoFarmer.unreadCount} new</Eyebrow>
            {!isEmpty && (
              <Link
                href="/notifications"
                className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                View all alerts
              </Link>
            )}
          </div>
          {isEmpty ? (
            <p className="mt-3 flex items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-4 text-sm text-agro-slate">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agro-mint text-agro-canopy" aria-hidden="true">
                <CheckIcon className="h-5 w-5" />
              </span>
              No alerts today — your crops are calm.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-agro-clay overflow-hidden rounded-2xl border border-agro-clay bg-white">
              {topAlerts.map((alert) => {
                const KindIcon = alertKindIcon[alert.kind];
                return (
                  <li key={alert.id}>
                    <Link
                      href="/notifications"
                      className="group flex items-center gap-3 p-4 transition-colors hover:bg-agro-mint/60"
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityTint[alert.severity]}`}>
                        <KindIcon className="h-5 w-5" />
                      </span>
                      <p className="min-w-0 flex-1 text-sm leading-snug text-agro-ink">
                        <span className="sr-only">{alert.severity}. </span>
                        {alert.message}
                      </p>
                      <span className="hidden shrink-0 font-mono text-xs text-agro-cloud sm:block">
                        {alert.relativeTime}
                      </span>
                      <ChevronRightIcon
                        className="h-4 w-4 shrink-0 text-agro-cloud transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-agro-canopy"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section aria-labelledby="actions-heading">
          <Eyebrow id="actions-heading">Quick actions</Eyebrow>
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const ActionIcon = quickActionIcon[action.icon];
              return (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-agro-clay bg-white p-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                      <ActionIcon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium leading-tight text-agro-ink">
                      {action.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Detect CTA — the page's single harvest-gold surface */}
        <Link
          href="/detect"
          className="group relative overflow-hidden rounded-3xl bg-agro-wheat p-6 text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
        >
          <svg
            className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 text-agro-forest/10"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
            <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
          </svg>
          <div className="relative flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-forest/70">
                Crop doctor
              </p>
              <h2 className="display-heading mt-2 max-w-sm font-display text-xl font-bold leading-snug sm:text-2xl">
                Spot disease before it spreads
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-agro-forest/80">
                Upload a photo of an affected leaf — get a diagnosis and what to
                do next, right on your phone.
              </p>
            </div>
            <span
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-agro-forest text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
              aria-hidden="true"
            >
              <CameraIcon className="h-6 w-6" />
            </span>
          </div>
        </Link>

        {/* My farms overview */}
        {!isEmpty && (
          <section aria-labelledby="farms-heading">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow id="farms-heading">My farms · {demoFarms.length}</Eyebrow>
              <Link
                href="/farms/new"
                className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                <PlusIcon className="h-4 w-4" />
                Add farm
              </Link>
            </div>
            <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
              {demoFarms.map((farm) => (
                <li key={farm.id} className="w-64 shrink-0 snap-start lg:w-auto">
                  <Link
                    href={`/farms/${farm.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-agro-clay bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                        <LeafIcon className="h-4 w-4" />
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                          farm.health === "good"
                            ? "bg-agro-mint text-agro-canopy"
                            : "bg-agro-warning/15 text-agro-earth"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            farm.health === "good" ? "bg-agro-success" : "bg-agro-warning"
                          }`}
                          aria-hidden="true"
                        />
                        {farm.health === "good" ? "Good" : "Watch"}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-agro-ink">
                      {farm.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-agro-slate">{farm.crops}</p>
                    <span className="mt-3 w-fit rounded-full bg-agro-stone px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                      {farm.stage}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="w-64 shrink-0 snap-start lg:w-auto">
                <Link
                  href="/farms/new"
                  className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-agro-sprout p-4 text-agro-canopy transition-colors hover:border-agro-canopy hover:bg-agro-mint"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">Add farm</span>
                </Link>
              </li>
            </ul>
          </section>
        )}

        {/* Setup checklist */}
        {!checklistDismissed && (
          <section
            aria-labelledby="checklist-heading"
            className="relative rounded-2xl border border-agro-sprout bg-white p-5"
          >
            <button
              type="button"
              onClick={() => checklistStore.dismiss()}
              aria-label="Dismiss setup checklist"
              className="absolute right-1 top-1 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-agro-cloud transition-colors hover:bg-agro-stone hover:text-agro-slate"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pr-12">
              <h2 id="checklist-heading" className="font-semibold text-agro-ink">
                Set up your farm
              </h2>
              <span className="font-mono text-xs text-agro-slate">
                {completedCount} of {checklistItems.length} complete
              </span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-agro-clay"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={checklistItems.length}
              aria-valuenow={completedCount}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-agro-canopy transition-[width] duration-300"
                style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
              />
            </div>
            <ul className="mt-4 space-y-1">
              {checklistItems.map((item, index) => {
                const done = index < completedCount;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-agro-mint/60"
                    >
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          done ? "bg-agro-canopy text-white" : "border-2 border-agro-clay bg-white"
                        }`}
                        aria-hidden="true"
                      >
                        {done && <CheckIcon className="h-3.5 w-3.5" />}
                      </span>
                      <span className={`flex-1 text-sm ${done ? "text-agro-cloud line-through" : "font-medium text-agro-ink"}`}>
                        {item.label}
                      </span>
                      <ChevronRightIcon
                        className="h-4 w-4 shrink-0 text-agro-cloud transition-colors group-hover:text-agro-canopy"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="pb-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-cloud">
          Demo build · sample data only
        </p>
      </div>
    </div>
  );
}
