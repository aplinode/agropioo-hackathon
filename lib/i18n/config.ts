/**
 * Single source of truth for every language Agropioo serves (spec FR-1).
 * Everything that needs a locale identity — URLs, <html lang>, direction,
 * switcher labels, hreflang — reads from this registry so the emitted pair
 * of lang+dir can never disagree (spec FR-2).
 */

export const LOCALES = ["en", "ur", "pa", "ps", "sd", "skr", "bal", "hno"] as const;

export type Locale = (typeof LOCALES)[number];

/** Locales other than English, which have a URL slug. */
export type LocalizedLocale = Exclude<Locale, "en">;

export type TextDirection = "ltr" | "rtl";

export interface LocaleEntry {
  readonly code: Locale;
  /** URL path segment; empty string for English (bare URLs are canonical English). */
  readonly urlSlug: string;
  /** BCP 47 tag emitted on <html lang>. */
  readonly htmlLang: string;
  readonly dir: TextDirection;
  /** Name shown in the switcher, written in the language itself. */
  readonly nativeName: string;
  readonly englishName: string;
  /**
   * Google hreflang only accepts ISO 639-1 codes; pa/skr/bal/hno have no safe
   * representation (research §5.6) so they get no alternate annotation.
   */
  readonly hreflang: string | null;
}

export const LOCALE_REGISTRY: Readonly<Record<Locale, LocaleEntry>> = {
  en: {
    code: "en",
    urlSlug: "",
    htmlLang: "en",
    dir: "ltr",
    nativeName: "English",
    englishName: "English",
    hreflang: "en",
  },
  ur: {
    code: "ur",
    urlSlug: "ur",
    htmlLang: "ur",
    dir: "rtl",
    nativeName: "اردو",
    englishName: "Urdu",
    hreflang: "ur",
  },
  pa: {
    code: "pa",
    urlSlug: "pa",
    htmlLang: "pa-Arab",
    dir: "rtl",
    nativeName: "پنجابی",
    englishName: "Punjabi (Shahmukhi)",
    hreflang: null,
  },
  ps: {
    code: "ps",
    urlSlug: "ps",
    htmlLang: "ps",
    dir: "rtl",
    nativeName: "پښتو",
    englishName: "Pashto",
    hreflang: "ps",
  },
  sd: {
    code: "sd",
    urlSlug: "sd",
    htmlLang: "sd",
    dir: "rtl",
    nativeName: "سنڌي",
    englishName: "Sindhi",
    hreflang: "sd",
  },
  skr: {
    code: "skr",
    urlSlug: "skr",
    htmlLang: "skr",
    dir: "rtl",
    nativeName: "سرائیکی",
    englishName: "Saraiki",
    hreflang: null,
  },
  bal: {
    code: "bal",
    urlSlug: "bal",
    htmlLang: "bal",
    dir: "rtl",
    nativeName: "بلوچی",
    englishName: "Balochi",
    hreflang: null,
  },
  hno: {
    code: "hno",
    urlSlug: "hno",
    htmlLang: "hno",
    dir: "rtl",
    nativeName: "ہندکو",
    englishName: "Hindko",
    hreflang: null,
  },
};

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALIZED_LOCALES: readonly LocalizedLocale[] = LOCALES.filter(
  (code): code is LocalizedLocale => code !== "en",
);

/** Locales eligible for hreflang alternates (FR-22). */
export const HREFLANG_LOCALES: readonly Locale[] = LOCALES.filter(
  (code) => LOCALE_REGISTRY[code].hreflang !== null,
);

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isLocalizedSlug(value: string): value is LocalizedLocale {
  return LOCALIZED_LOCALES.some((code) => code === value);
}

/** Maps a URL slug back to its locale; English has no slug so never matches. */
export function localeBySlug(slug: string): LocalizedLocale | null {
  if (!isLocalizedSlug(slug)) return null;
  return slug;
}

export function localeEntry(code: Locale): LocaleEntry {
  return LOCALE_REGISTRY[code];
}
