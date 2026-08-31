"use client";

import { useSyncExternalStore, useState, type ReactNode } from "react";
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
  LeafIcon,
  MapPinIcon,
  PlusIcon,
  TagIcon,
  TrendingUpIcon,
  XIcon,
  LogOutIcon,
} from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LatinInline } from "@/components/latin-inline";
import type { Locale } from "@/lib/i18n/config";
import type { DashboardBundle } from "./dashboard-bundle";

const CHECKLIST_DISMISS_KEY = "agropioo-checklist-dismissed";

const topAlerts: Array<{
  id: string;
  kind: "pest" | "weather" | "price";
  severity: "critical" | "warning" | "info";
  message: string;
  relativeTime: string;
}> = [];

export { LatinInline };

const latin = (
  children: ReactNode,
  className?: string
): ReactNode => <LatinInline className={className}>{children}</LatinInline>;

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

async function signOut() {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    if (!data.ok) throw new Error("logout failed");
  } catch {}
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.cookie = "agro_session=; path=/; max-age=0; samesite=lax";
    document.cookie = "agro_verify=; path=/; max-age=0; samesite=lax";
    document.cookie = "agro_reset=; path=/; max-age=0; samesite=lax";
  } catch {}
  window.location.href = "/login";
}

const severityChip = {
  critical: "bg-agro-forest text-white",
  warning: "bg-agro-canopy/10 text-agro-canopy",
  info: "bg-agro-mint text-agro-slate",
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
      {meta && <span className="font-mono text-xs text-agro-slate">{meta}</span>}
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
  weatherAvailable?: boolean;
  appLocale?: Locale;
  bundle: DashboardBundle;
  farms?: Array<Record<string, unknown>>;
  user?: { fullName: string; email: string };
};

const CHECKLIST_ITEMS = [
  { id: "checklist-farm", label: "Add your first farm", href: "/farms/new" },
  { id: "checklist-advisor", label: "Ask the advisor once", href: "/advisor" },
  { id: "checklist-detect", label: "Run your first detection", href: "/detect" },
] as const;

const QUICK_ACTIONS = [
  { id: "action-record", label: "Add record", href: "/records/new", icon: "clipboard" as const },
  { id: "action-advisor", label: "Ask advisor", href: "/advisor", icon: "chat" as const },
  { id: "action-scan", label: "Scan crop", href: "/detect", icon: "camera" as const },
  { id: "action-prices", label: "Check prices", href: "/prices", icon: "tag" as const },
] as const;

export default function DashboardView({
  variant,
  weatherAvailable = true,
  appLocale,
  bundle,
  farms: realFarms,
  user: realUser,
}: DashboardViewProps) {
  const isEmpty = variant === "empty";
  const completedCount = isEmpty ? 0 : 1;
  const checklistDismissed = useSyncExternalStore(
    checklistStore.subscribe.bind(checklistStore),
    checklistStore.getSnapshot,
    checklistStore.getServerSnapshot
  );

  const [showProfile, setShowProfile] = useState(false);

  const displayFarms = (realFarms ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    location: f.location as string,
    acres: f.acres as number,
    crops: Array.isArray(f.crops) ? (f.crops as string[]).join(', ') : String(f.crops),
    stage: f.growth_stages && typeof f.growth_stages === 'object'
      ? Object.values(f.growth_stages as Record<string, string>).filter(Boolean).join(', ') || 'Active'
      : 'Active',
    health: (f.health as 'good' | 'watch') || 'good',
  }));

  const displayUser = realUser
    ? {
        firstName: realUser.fullName.split(" ")[0],
        lastName: realUser.fullName.split(" ").slice(1).join(" "),
        initials: realUser.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        email: realUser.email,
      }
    : {
        firstName: "Farmer",
        lastName: "",
        initials: "F",
        email: "",
      };

  const severityWord = {
    critical: bundle.severityCritical,
    warning: bundle.severityWatch,
    info: bundle.severityInfo,
  } as const;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-9 pt-1">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
            {latin(todayLabel)}
          </p>
          <h1 className="display-heading mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-agro-forest sm:text-4xl">
            {bundle.greeting.replace("{name}", displayUser.firstName)}
          </h1>
          {!isEmpty && realUser && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-agro-slate">
              <MapPinIcon size={16} className="shrink-0 text-agro-canopy" />
              {latin(realUser.email)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            onClick={() => setShowProfile(!showProfile)}
            role="button"
            aria-label={bundle.profileMenu}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-agro-canopy font-semibold text-white transition-colors ${showProfile ? "border-2 border-agro-sprout" : ""} hover:bg-agro-forest`}
          >
            <span style={{ fontWeight: "bold", color: "white" }}>
              {latin(displayUser.initials)}
            </span>
          </div>
          {showProfile && (
            <div
              className="absolute end-0 mt-2 w-48 rounded-md bg-white py-2 shadow-lg border border-agro-sprout/20 z-50 min-w-[160px]"
            >
              <div className="px-4 py-3 text-sm text-agro-forest">
                <div className="font-medium">{latin(<>{displayUser.firstName} {displayUser.lastName}</>)}</div>
                <div className="text-agro-slate text-xs">
                  {latin(displayUser.email)}
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            aria-label={bundle.signOut}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-agro-sprout bg-white px-3 font-mono text-sm font-semibold text-agro-slate transition-colors hover:border-agro-canopy hover:text-agro-canopy"
          >
            <LogOutIcon size={12} className="h-4 w-4 shrink-0" />
            {bundle.signOut}
          </button>
          <LanguageSwitcher label={bundle.languageLabel} currentLocale={appLocale} />
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
                {bundle.welcomeEyebrow}
              </p>
              <h2
                id="welcome-hero"
                className="display-heading mt-3 max-w-md font-display text-2xl font-bold leading-snug sm:text-[1.9rem]"
              >
                {bundle.welcomeTitle}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                {bundle.welcomeBody}
              </p>
              <Link
                href="/farms/new"
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                <PlusIcon className="h-4 w-4" />
                {bundle.addFirstFarm}
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
                  {bundle.seasonTipBadge}
                </span>
              </div>
              <span className="absolute end-6 top-6 font-mono text-xs uppercase tracking-wide text-agro-sprout/80 sm:end-8 sm:top-8">
                {bundle.today}
              </span>
              <h2 id="advisory-heading" className="sr-only">
                {bundle.advisoryTitle}
              </h2>
              <p className="display-heading mt-5 max-w-lg font-display text-[1.55rem] font-semibold leading-snug sm:text-[1.85rem]">
                {bundle.carryToField}.
              </p>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-white/80">
                {bundle.askAdvisor}
              </p>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-16 border-t border-dashed border-white/25"
            />
            <div className="flex h-16 items-center justify-between gap-3 px-6 sm:px-8">
              <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-sprout/70 sm:block">
                {bundle.carryToField}
              </p>
              <Link
                href="/advisor"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-agro-forest transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
              >
                {bundle.askAdvisor}
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
                  {bundle.weatherTitle.replace("{location}", "Your area")}
                </h2>
                <CloudRainIcon className="h-5 w-5 shrink-0 text-agro-canopy" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm text-agro-slate">
                Weather data will appear here once your farm location is set.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
                {bundle.weatherTitle.replace("{location}", "Your area")}
              </h2>
              <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-agro-slate">
                <CloudRainIcon className="mt-0.5 h-5 w-5 shrink-0 text-agro-slate" aria-hidden="true" />
                {bundle.weatherUnavailable}
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
                {bundle.seasonTipBadge}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-agro-slate">
                {bundle.today}
              </span>
            </div>
            <h2
              id="season-tip-heading"
              className="display-heading mt-3 font-display text-lg font-bold leading-snug text-agro-forest sm:text-xl"
            >
              {bundle.welcomeTitle}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-agro-slate">
              {bundle.welcomeBody}
            </p>
          </div>
        </section>
      )}

      {/* Alerts strip */}
      <section aria-labelledby="alerts-heading">
        <SectionHead
          id="alerts-heading"
          title={bundle.alertsHeading}
          meta={isEmpty ? undefined : bundle.newCount.replace("{n}", "0")}
          action={
            !isEmpty ? (
              <Link
                href="/notifications"
                className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                {bundle.viewAllAlerts}
              </Link>
            ) : undefined
          }
        />
        {topAlerts.length === 0 ? (
          <p className="mt-3 flex items-center gap-3 rounded-2xl border border-agro-sprout bg-agro-mint p-4 text-sm text-agro-slate">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-agro-canopy"
              aria-hidden="true"
            >
              <CheckIcon className="h-5 w-5" />
            </span>
            {bundle.noAlerts}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
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
                      <span className="sr-only">{bundle.alertAria}</span>
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-agro-ink">
                      {alert.message}
                    </p>
                    <span className="hidden shrink-0 font-mono text-xs text-agro-slate md:block">
                      {latin(alert.relativeTime)}
                    </span>
                    <ChevronRightIcon
                      className="h-4 w-4 shrink-0 text-agro-slate transition-transform duration-200 group-hover:text-agro-canopy"
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
        <SectionHead id="actions-heading" title={bundle.quickActionsHeading} />
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action) => {
            const ActionIcon = quickActionIcon[action.icon];
            return (
              <li key={action.id}>
                <Link
                  href={action.href}
                  className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-agro-sprout bg-white p-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
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
              {bundle.cropDoctor}
            </p>
            <h2 className="display-heading mt-2 max-w-sm font-display text-xl font-bold leading-snug sm:text-2xl">
              {bundle.detectTitle}
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/80">
              {bundle.detectBody}
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
            title={bundle.myFarms}
            meta={String(displayFarms.length)}
            action={
              <Link
                href="/farms"
                className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                {bundle.viewAllFarms}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            }
          />
          <ul className="mt-3 flex flex-wrap gap-4 pb-2 lg:grid lg:grid-cols-3 lg:pb-0">
            {displayFarms.map((farm) => (
              <li key={farm.id} className="w-full min-w-[min(16rem,100%)] flex-1 basis-64 sm:basis-72 lg:w-auto">
                <Link
                  href={`/farms/${farm.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-agro-sprout bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
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
                      {farm.health === "good" ? bundle.healthGood : bundle.healthWatch}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-agro-ink">
                    {farm.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-agro-slate">{farm.crops}</p>
                  <span className="mt-3 w-fit rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
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
                <span className="text-sm font-semibold">{bundle.addFarm}</span>
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
            aria-label={bundle.dismissChecklist}
            className="absolute end-1 top-1 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-white hover:text-agro-forest"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pe-12">
            <h2 id="checklist-heading" className="font-display text-lg font-bold text-agro-forest">
              {bundle.setupChecklist}
            </h2>
            <span className="font-mono text-xs text-agro-slate">
              {bundle.checklistProgress.replace("{done}", String(completedCount)).replace("{total}", String(CHECKLIST_ITEMS.length))}
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={CHECKLIST_ITEMS.length}
            aria-valuenow={completedCount}
            aria-label={bundle.setupProgress}
          >
            <div
              className="h-full rounded-full bg-agro-canopy transition-[width] duration-300"
              style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-1">
            {CHECKLIST_ITEMS.map((item, index) => {
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
                      className={`flex-1 text-sm ${done ? "text-agro-slate line-through" : "font-medium text-agro-ink"}`}
                    >
                      {item.label}
                    </span>
                    <ChevronRightIcon
                      className="h-4 w-4 shrink-0 text-agro-slate transition-colors group-hover:text-agro-canopy"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
