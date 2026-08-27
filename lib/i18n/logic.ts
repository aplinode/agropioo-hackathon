/**
 * Pure i18n logic — no React, no Next imports — so it can be unit-tested
 * directly and reused by the proxy, server loader, and client switcher.
 */

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_REGISTRY,
  localeBySlug,
  type Locale,
  type LocalizedLocale,
} from "./config";

export interface ParsedPath {
  /** Locale when the path carries a slug prefix; null for bare (English) paths. */
  locale: LocalizedLocale | null;
  /** The path without its locale prefix; always starts with "/". */
  rest: string;
}

/** Splits "/ur/features?a=1" into { locale: "ur", rest: "/features" }. Bare paths return null locale. */
export function splitLocalePrefix(pathname: string): ParsedPath {
  const trimmed = pathname.replace(/^\/+/, "");
  const segments = trimmed.split("/");
  const first = segments[0] ?? "";
  const locale = localeBySlug(first);
  if (!locale) {
    return { locale: null, rest: normalizePath(pathname) };
  }
  const restSegments = segments.slice(1);
  const rest = "/" + restSegments.join("/");
  return { locale, rest: normalizePath(rest) };
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return "/" + path;
  // Collapse a bare prefix ("/ur") or trailing slash ("/features/") to canonical form.
  if (path.length > 1 && path.endsWith("/")) return path.replace(/\/+$/, "") || "/";
  return path;
}

/**
 * Public href for `path` in `locale`. English links stay bare (FR-4); other
 * locales get "/{slug}{path}" with "/ur" (not "/ur/") as the root form.
 */
export function localeHref(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return normalizePath(path);
  const slug = LOCALE_REGISTRY[locale].urlSlug;
  const normalized = normalizePath(path);
  if (normalized === "/") return `/${slug}`;
  return `/${slug}${normalized}`;
}

/**
 * The pathname to navigate to when switching `target` from `currentPathname`
 * (query/hash are appended by the caller). Never navigates home (FR-6).
 */
export function switchedPathname(currentPathname: string, target: Locale): string {
  const { locale, rest } = splitLocalePrefix(currentPathname);
  const contentPath = locale ? rest : normalizePath(currentPathname);
  return localeHref(target, contentPath === "" ? "/" : contentPath);
}

/**
 * Resolves the farmer-app display language from the persisted preference
 * value (dashboard-i18n spec FR-4/FR-6): absent, empty, or unknown values
 * fall back to English. Matching is strict lowercase — the switcher only
 * ever writes registry codes.
 */
export function resolveAppLocale(value: string | undefined | null): Locale {
  return typeof value === "string" && isLocale(value) ? value : DEFAULT_LOCALE;
}

export type StringTable = Readonly<Record<string, string>>;

export interface ResolvedString {
  text: string;
  /** True when the value came from the English table (or is absent entirely). */
  isFallback: boolean;
}

/**
 * Missing/empty values resolve to English (FR-12); if both are missing the
 * result is empty and callers render nothing rather than raw catalog keys.
 */
export function resolveString(
  primary: StringTable,
  fallback: StringTable,
  key: string,
): ResolvedString {
  const own = primary[key];
  if (typeof own === "string" && own.trim() !== "") {
    return { text: own, isFallback: false };
  }
  const english = fallback[key];
  if (typeof english === "string" && english.trim() !== "") {
    return { text: english, isFallback: true };
  }
  return { text: "", isFallback: true };
}

/** Substitutes {name} placeholders; unknown names stay visible instead of crashing. */
export function formatMessage(
  template: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
