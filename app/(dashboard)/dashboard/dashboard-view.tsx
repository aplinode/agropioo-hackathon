"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { FurrowMotif } from "@/components/FurrowMotif";
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
  MapPinIcon,
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

/* Severity expressed as a green-intensity ladder + icon + word — never a
   second hue (this build is greens + whites/neutrals only). */
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

/* Section marker: mono field label on a furrow hairline running off to the
   right — the scan order of the farmer's day, read top to bottom. */
function SectionHead({
  id,
  title,
  meta,
  action,
}: {
  id: string;
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <h2
        id={id}
        className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
      >
        {title}
      </h2>
      {meta && <span className="font-mono text-xs text-agro-cloud">{meta}</span>}
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-gradient-to-r from-agro-sprout to-transparent"
      />
      {action}
    </div>
  );
}

type DashboardViewProps = {
  variant: "default" | "empty";
  /** Demo toggle (?weather=off) so the unavailable-weather fallback can be shown. */
  weatherAvailable?: boolean;
};

/* Farmer home screen — answers "kya karoon aaj?" in one scan.
   UI-only demo build; all content comes from typed mock data.
   Field-ledger visual language: dark forest panels carrying furrow motifs,
   a punched-ticket advisory pass, mono section markers, greens +
   whites/neutrals only. DOM order follows specs/dashboard/spec.md FR1–FR10. */
export default function DashboardView({
  variant,
  weatherAvailable = true,
}: DashboardViewProps) {
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
    <div className="space-y-9 pt-1">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
            {demoFarmer.todayLabel}
          </p>
          <h1 className="display-heading mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-agro-forest sm:text-4xl">
            Assalam-o-Alaikum, {demoFarmer.firstName}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-agro-slate">
            <MapPinIcon size={16} className="shrink-0 text-agro-canopy" />
            {demoFarmer.location}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/notifications"
            aria-label={`Notifications, ${demoFarmer.unreadCount} unread`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-agro-sprout bg-white text-agro-slate transition-colors hover:border-agro-canopy hover:text-agro-canopy"
          >
            <BellIcon className="h-5 w-5" />
            {demoFarmer.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agro-forest px-1 font-mono text-[0.65rem] font-semibold leading-none text-white ring-2 ring-white">
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
            <GlobeIcon size={16} />
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

      {/* Opening row: advisory field-pass + weather snapshot.
          First-run farmers get the welcome hero in the advisory slot. */}
      <div className="grid gap-4 lg:grid-cols-12">
        {isEmpty ? (
          <section
            aria-labelledby="welcome-hero"
            className="relative overflow-hidden rounded-3xl bg-agro-forest pb-44 text-white lg:col-span-7"
          >
            <FurrowMotif
              tone="ghost"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-agro-sprout/25"
            />
            <div className="relative p-6 sm:p-8">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-sprout">
                Welcome to Agropioo
              </p>
              <h2
                id="welcome-hero"
                className="display-heading mt-3 max-w-md font-display text-2xl font-bold leading-snug sm:text-[1.9rem]"
              >
                Start With Your First Farm.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                Your crop, your soil, your weather — every advisory will be
                shaped around them once your farm is in.
              </p>
              <Link
                href="/farms/new"
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                <PlusIcon className="h-4 w-4" />
                Add your first farm
              </Link>
            </div>
          </section>
        ) : (
          <section
            aria-labelledby="advisory-heading"
            className="field-ticket relative self-start overflow-hidden rounded-3xl bg-agro-forest text-white lg:col-span-7"
          >
            <div className="p-6 pb-7 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 pe-16 sm:pe-24">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
                  {demoAdvisory.crop}
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
                  {demoAdvisory.stage}
                </span>
              </div>
              <span className="absolute end-6 top-6 font-mono text-xs uppercase tracking-wide text-agro-sprout/80 sm:end-8 sm:top-8">
                Today
              </span>
              <h2 id="advisory-heading" className="sr-only">
                Today&apos;s advisory
              </h2>
              <p className="display-heading mt-5 max-w-lg font-display text-[1.55rem] font-semibold leading-snug sm:text-[1.85rem]">
                {advisory.action}.
              </p>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-white/80">
                {advisory.why}
              </p>
            </div>
            {/* Perforation + tear-off stub: the advisor rides along to the field */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-16 border-t border-dashed border-white/25"
            />
            <div className="flex h-16 items-center justify-between gap-3 px-6 sm:px-8">
              <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-sprout/70 sm:block">
                Carry it to the field
              </p>
              <Link
                href="/advisor"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-agro-forest transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
              >
                Ask the advisor
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </section>
        )}

        {/* Weather snapshot — farm-independent, so it renders in every variant */}
        <section
          aria-labelledby="weather-heading"
          className="flex flex-col rounded-3xl border border-agro-sprout bg-white p-6 lg:col-span-5"
        >
          {weatherAvailable ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
                  Weather · {demoWeather.location}
                </h2>
                <CloudRainIcon className="h-5 w-5 shrink-0 text-agro-canopy" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-sm font-medium leading-snug text-agro-ink">
                  {demoWeather.condition}
                </p>
                <p
                  className="font-mono text-[2.75rem] font-bold leading-none tracking-tight text-agro-forest"
                  aria-label={`${demoWeather.temperatureC} degrees Celsius`}
                >
                  {demoWeather.temperatureC}°
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-agro-stone px-2 py-1 font-mono text-xs text-agro-slate">
                  H {demoWeather.highC}°
                </span>
                <span className="rounded-md bg-agro-stone px-2 py-1 font-mono text-xs text-agro-slate">
                  L {demoWeather.lowC}°
                </span>
              </div>
              <p className="mt-3 rounded-xl bg-agro-mint px-3 py-2.5 text-xs leading-relaxed text-agro-slate">
                {demoWeather.rainNote}
              </p>
              <Link
                href="/weather"
                className="mt-auto inline-flex min-h-11 items-center gap-1 pt-3 text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                Full forecast
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </>
          ) : (
            /* Explanatory fallback, not an error dump (spec FR10c). */
            <>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
                Weather · {demoWeather.location}
              </h2>
              <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-agro-slate">
                <CloudRainIcon className="mt-0.5 h-5 w-5 shrink-0 text-agro-cloud" aria-hidden="true" />
                Weather isn&apos;t loading right now. Check again in a little
                while — your advisories keep working meanwhile.
              </p>
            </>
          )}
        </section>
      </div>

      {/* First-run farmers still get a generic seasonal tip — never
          crop-specific advice before a farm exists (spec FR10a). */}
      {isEmpty && (
        <section aria-labelledby="season-tip-heading">
          <div className="relative overflow-hidden rounded-2xl border border-agro-sprout bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-agro-mint px-3 py-1 text-xs font-semibold text-agro-canopy">
                Season tip
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-agro-cloud">
                Today
              </span>
            </div>
            <h2
              id="season-tip-heading"
              className="display-heading mt-3 font-display text-lg font-bold leading-snug text-agro-forest sm:text-xl"
            >
              {demoSeasonTip.action}.
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-agro-slate">
              {demoSeasonTip.why}
            </p>
          </div>
        </section>
      )}

      {/* Alerts strip */}
      <section aria-labelledby="alerts-heading">
        <SectionHead
          id="alerts-heading"
          title="Alerts"
          meta={isEmpty ? undefined : `${demoFarmer.unreadCount} new`}
          action={
            !isEmpty ? (
              <Link
                href="/notifications"
                className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                View all alerts
              </Link>
            ) : undefined
          }
        />
        {isEmpty ? (
          <p className="mt-3 flex items-center gap-3 rounded-2xl border border-agro-sprout bg-agro-mint p-4 text-sm text-agro-slate">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-agro-canopy"
              aria-hidden="true"
            >
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
                    className="group flex items-center gap-3 p-4 transition-colors hover:bg-agro-mint/50"
                  >
                    <span
                      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.7rem] font-semibold ${severityChip[alert.severity]}`}
                    >
                      <KindIcon className="h-3.5 w-3.5" />
                      {severityWord[alert.severity]}
                      <span className="sr-only">alert</span>
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-agro-ink">
                      {alert.message}
                    </p>
                    <span className="hidden shrink-0 font-mono text-xs text-agro-cloud md:block">
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
        <SectionHead id="actions-heading" title="Quick actions" />
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const ActionIcon = quickActionIcon[action.icon];
            return (
              <li key={action.id}>
                <Link
                  href={action.href}
                  className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-agro-clay bg-white p-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
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

      {/* Detect CTA — the page's single high-emphasis surface (deep green) */}
      <Link
        href="/detect"
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-agro-canopy to-agro-forest p-6 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
      >
        <FurrowMotif
          tone="ghost"
          className="pointer-events-none absolute inset-x-0 -bottom-1 w-full text-agro-sprout/20"
        />
        <div className="relative flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-sprout">
              Crop doctor
            </p>
            <h2 className="display-heading mt-2 max-w-sm font-display text-xl font-bold leading-snug sm:text-2xl">
              Spot disease before it spreads
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/80">
              Upload a photo of an affected leaf — get a diagnosis and what to
              do next, right on your phone.
            </p>
          </div>
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-white/20"
            aria-hidden="true"
          >
            <CameraIcon className="h-6 w-6" />
          </span>
        </div>
      </Link>

      {/* My farms overview */}
      {!isEmpty && (
        <section aria-labelledby="farms-heading">
          <SectionHead
            id="farms-heading"
            title="My farms"
            meta={String(demoFarms.length)}
            action={
              <Link
                href="/farms/new"
                className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                <PlusIcon className="h-4 w-4" />
                Add farm
              </Link>
            }
          />
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {demoFarms.map((farm) => (
              <li key={farm.id} className="w-64 shrink-0 snap-start lg:w-auto">
                <Link
                  href={`/farms/${farm.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-agro-clay bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                      <LeafIcon className="h-4 w-4" />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                        farm.health === "good"
                          ? "bg-agro-mint text-agro-canopy"
                          : "border border-agro-canopy/30 bg-white text-agro-ink"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          farm.health === "good" ? "bg-agro-success" : "border border-agro-forest"
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
          className="relative rounded-2xl border border-agro-sprout bg-agro-mint p-5"
        >
          <button
            type="button"
            onClick={() => checklistStore.dismiss()}
            aria-label="Dismiss setup checklist"
            className="absolute right-1 top-1 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-white hover:text-agro-forest"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pe-12">
            <h2 id="checklist-heading" className="font-display text-lg font-bold text-agro-forest">
              Set up your farm
            </h2>
            <span className="font-mono text-xs text-agro-slate">
              {completedCount} of {checklistItems.length} complete
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"
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
                    className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/70"
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        done ? "bg-agro-canopy text-white" : "border-2 border-agro-sprout bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {done && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={`flex-1 text-sm ${done ? "text-agro-cloud line-through" : "font-medium text-agro-ink"}`}
                    >
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
  );
}
