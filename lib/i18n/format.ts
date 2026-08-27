/**
 * Digit policy (spec FR-19): Eastern Arabic-Indic numerals in the seven local
 * languages, Western digits in English — applied through this one formatter.
 */
import type { Locale } from "./config";

const NUMBERING_SYSTEMS: Readonly<Record<Locale, string>> = {
  en: "latn",
  ur: "arabext",
  pa: "arabext",
  ps: "arabext",
  sd: "arabext",
  skr: "arabext",
  bal: "arabext",
  hno: "arabext",
};

const BCP47_TAGS: Readonly<Record<Locale, string>> = {
  en: "en-US",
  ur: "ur-u-nu-arabext",
  pa: "pa-Arab-u-nu-arabext",
  ps: "ps-u-nu-arabext",
  sd: "sd-u-nu-arabext",
  skr: "skr-u-nu-arabext",
  bal: "bal-u-nu-arabext",
  hno: "hno-u-nu-arabext",
};

/** 3500 → "۳٬۵۰۰" in Urdu-class locales, "3,500" in English. */
export function formatNumber(value: number, locale: Locale): string {
  const tag = `en-US-u-nu-${NUMBERING_SYSTEMS[locale]}`;
  return new Intl.NumberFormat(tag).format(value);
}

/** Formats a number followed by a unit label kept direction-safe by callers. */
export function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}

/** Used internally to bucket ms differences into the coarsest readable unit. */
const SECONDS_PER: Readonly<Record<string, number>> = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604_800,
  month: 25_920_000,
  year: 31_536_000,
};

function pickUnit(
  absDiffMs: number,
): [value: number, unit: Intl.RelativeTimeFormatUnit] {
  const s = absDiffMs / 1_000;
  if (s < 60) return [0, "second"]; // "just now" / "now" via numeric:"auto"
  if (s < SECONDS_PER.hour)
    return [Math.round(s / SECONDS_PER.minute), "minute"];
  if (s < SECONDS_PER.day)
    return [Math.round(s / SECONDS_PER.hour), "hour"];
  if (s < SECONDS_PER.week)
    return [Math.round(s / SECONDS_PER.day), "day"];
  if (s < SECONDS_PER.month)
    return [Math.round(s / SECONDS_PER.week), "week"];
  if (s < SECONDS_PER.year)
    return [Math.round(s / SECONDS_PER.month), "month"];
  return [Math.round(s / SECONDS_PER.year), "year"];
}

/**
 * Human-readable relative time: "just now", "2 hours ago", "in 3 days".
 * Uses Intl.RelativeTimeFormat so pluralization and Eastern Arabic digits
 * (FR-19) come for free per locale. Pass `now` explicitly for deterministic tests.
 */
export function formatRelativeTime(
  target: Date,
  now: Date = new Date(),
  locale: Locale = "en",
): string {
  const diffMs = target.getTime() - now.getTime();
  const [value, unit] = pickUnit(Math.abs(diffMs));
  const sign = diffMs >= 0 ? 1 : -1;
  return new Intl.RelativeTimeFormat(BCP47_TAGS[locale], {
    numeric: "auto",
    style: "long",
  }).format(sign * value, unit);
}
