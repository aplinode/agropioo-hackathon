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

type DashboardViewProps = {
  variant: "default" | "empty";
};

/* Farmer home screen — answers "kya karoon aaj?" in one scan.
   UI-only demo build; all content comes from typed mock data. */
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="display-heading font-display text-2xl font-bold tracking-tight text-agro-ink sm:text-3xl">
            Assalam-o-Alaikum, {demoFarmer.firstName}
          </h1>
          <p className="mt-1 text-sm text-agro-slate">{demoFarmer.location}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/notifications"
            aria-label={`Notifications, ${demoFarmer.unreadCount} unread`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy"
          >
            <BellIcon className="h-[22px] w-[22px]" />
            {demoFarmer.unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agro-error px-1 font-mono text-[0.65rem] font-semibold leading-none text-white">
                {demoFarmer.unreadCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            title="Language switching coming soon"
            aria-label="Change language (coming soon)"
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 font-mono text-sm font-semibold text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy"
          >
            <GlobeIcon className="h-5 w-5" />
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

      {/* Empty-state welcome hero */}
      {isEmpty && (
        <section
          aria-labelledby="welcome-hero"
          className="rounded-2xl border border-agro-sprout bg-agro-mint p-6"
        >
          <h2 id="welcome-hero" className="font-display text-xl font-bold text-agro-forest">
            Welcome to Agropioo
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-agro-slate">
            Add your first farm and Agropioo will tailor every advisory to your
            crop, your soil, and your weather.
          </p>
          <Link
            href="/farms/new"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
          >
            <PlusIcon className="h-4 w-4" />
            Add your first farm
          </Link>
        </section>
      )}

      {/* Today's advisory + weather */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section
          aria-labelledby="advisory-heading"
          className="rounded-2xl border border-agro-sprout bg-agro-mint p-5 lg:col-span-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {isEmpty ? (
              <span className="rounded-full border border-agro-sprout bg-white px-3 py-1 text-xs font-semibold text-agro-canopy">
                Season tip
              </span>
            ) : (
              <>
                <span className="rounded-full border border-agro-sprout bg-white px-3 py-1 text-xs font-semibold text-agro-canopy">
                  {demoAdvisory.crop}
                </span>
                <span className="rounded-full border border-agro-clay bg-agro-stone px-3 py-1 text-xs font-medium text-agro-slate">
                  {demoAdvisory.stage}
                </span>
              </>
            )}
            <span className="ml-auto font-mono text-xs uppercase tracking-wide text-agro-slate">
              Today
            </span>
          </div>
          <h2 id="advisory-heading" className="sr-only">
            Today&apos;s advisory
          </h2>
          <p className="mt-3 text-lg font-bold leading-snug text-agro-ink">{advisory.action}</p>
          <p className="mt-1 text-sm leading-relaxed text-agro-slate">{advisory.why}</p>
          <Link
            href="/advisor"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
          >
            Ask the advisor
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </section>

        <section
          aria-labelledby="weather-heading"
          className="rounded-2xl border border-agro-clay bg-white p-5 lg:col-span-2"
        >
          <h2 id="weather-heading" className="font-mono text-xs uppercase tracking-wide text-agro-slate">
            Weather · {demoWeather.location}
          </h2>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-agro-ink">
                <CloudRainIcon className="h-4 w-4 text-agro-info" />
                {demoWeather.condition}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-agro-slate">{demoWeather.rainNote}</p>
            </div>
            <div className="text-end">
              <p className="font-mono text-4xl font-bold leading-none text-agro-forest">
                {demoWeather.temperatureC}°C
              </p>
              <p className="mt-1.5 font-mono text-xs text-agro-slate">
                H {demoWeather.highC}° · L {demoWeather.lowC}°
              </p>
            </div>
          </div>
          <Link
            href="/weather"
            className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
          >
            Full forecast
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* Alerts strip */}
      <section aria-labelledby="alerts-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="alerts-heading" className="text-base font-bold text-agro-ink">
            Alerts
          </h2>
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
          <p className="mt-3 flex items-center gap-3 rounded-2xl border border-agro-sprout bg-agro-mint p-4 text-sm text-agro-slate">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-canopy/10 text-agro-canopy" aria-hidden="true">
              <CheckIcon className="h-4 w-4" />
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
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-agro-stone/60"
                  >
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityTint[alert.severity]}`}>
                      <KindIcon className="h-5 w-5" />
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-agro-ink">
                      <span className="sr-only">{alert.severity}. </span>
                      {alert.message}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-agro-cloud">
                      {alert.relativeTime}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-base font-bold text-agro-ink">
          Quick actions
        </h2>
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const ActionIcon = quickActionIcon[action.icon];
            return (
              <li key={action.id}>
                <Link
                  href={action.href}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-agro-clay bg-white p-2 text-center transition-shadow hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-agro-mint text-agro-canopy">
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
        className="group flex items-center gap-4 rounded-2xl bg-agro-wheat p-5 text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-forest/70">
            Crop doctor
          </p>
          <h2 className="mt-1.5 text-lg font-bold leading-snug">
            Spot disease before it spreads
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-agro-forest/80">
            Upload a photo of an affected leaf — get a diagnosis and what to do
            next.
          </p>
        </div>
        <span
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-agro-forest text-white transition-transform duration-200 group-hover:-translate-y-0.5"
          aria-hidden="true"
        >
          <CameraIcon className="h-5 w-5" />
        </span>
      </Link>

      {/* My farms overview */}
      {!isEmpty && (
        <section aria-labelledby="farms-heading">
          <h2 id="farms-heading" className="text-base font-bold text-agro-ink">
            My farms
          </h2>
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {demoFarms.map((farm) => (
              <li key={farm.id} className="w-64 shrink-0 snap-start lg:w-auto">
                <Link
                  href={`/farms/${farm.id}`}
                  className="flex h-full flex-col rounded-2xl border border-agro-clay bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <h3 className="line-clamp-2 font-semibold leading-snug text-agro-ink">
                    {farm.name}
                  </h3>
                  <p className="mt-1 text-sm text-agro-slate">{farm.crops}</p>
                  <span className="mt-2 w-fit rounded-full bg-agro-mint px-2.5 py-1 text-xs font-medium text-agro-canopy">
                    {farm.stage}
                  </span>
                  <p className="mt-auto flex items-center gap-2 pt-3 text-xs text-agro-slate">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        farm.health === "good" ? "bg-agro-success" : "bg-agro-warning"
                      }`}
                      aria-hidden="true"
                    />
                    {farm.health === "good" ? "Health looks good" : "Needs a look"}
                    <span className="sr-only">
                      {farm.health === "good" ? "" : " (warning)"}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
            <li className="w-64 shrink-0 snap-start lg:w-auto">
              <Link
                href="/farms/new"
                className="flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-agro-sprout p-4 text-agro-canopy transition-colors hover:border-agro-canopy hover:bg-agro-mint"
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
          className="relative rounded-2xl border border-agro-clay bg-white p-5"
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
              className="h-full rounded-full bg-agro-leaf transition-[width] duration-300"
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
                    className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-agro-stone/60"
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        done ? "bg-agro-success text-white" : "border-2 border-agro-clay bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {done && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`flex-1 text-sm ${done ? "text-agro-cloud line-through" : "font-medium text-agro-ink"}`}>
                      {item.label}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-agro-cloud" aria-hidden="true" />
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
  );
}
