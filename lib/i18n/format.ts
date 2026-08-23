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

/** 3500 → "۳٬۵۰۰" in Urdu-class locales, "3,500" in English. */
export function formatNumber(value: number, locale: Locale): string {
  const tag = `en-US-u-nu-${NUMBERING_SYSTEMS[locale]}`;
  return new Intl.NumberFormat(tag).format(value);
}

/** Formats a number followed by a unit label kept direction-safe by callers. */
export function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}
