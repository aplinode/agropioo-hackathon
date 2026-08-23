import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  HREFLANG_LOCALES,
  LOCALIZED_LOCALES,
  LOCALES,
  LOCALE_REGISTRY,
} from "./config";
import {
  formatMessage,
  localeHref,
  resolveString,
  splitLocalePrefix,
  switchedPathname,
} from "./logic";

describe("locale registry", () => {
  it("serves exactly the eight constitutional languages", () => {
    expect(LOCALES).toEqual(["en", "ur", "pa", "ps", "sd", "skr", "bal", "hno"]);
  });

  it("gives every localized language an RTL direction and unique slug", () => {
    const slugs = new Set<string>();
    for (const code of LOCALIZED_LOCALES) {
      const entry = LOCALE_REGISTRY[code];
      expect(entry.dir, `${code} must be rtl`).toBe("rtl");
      expect(entry.urlSlug.length, `${code} must have a slug`).toBeGreaterThan(0);
      expect(slugs.has(entry.urlSlug), `slug ${entry.urlSlug} must be unique`).toBe(false);
      slugs.add(entry.urlSlug);
    }
    expect(LOCALE_REGISTRY.en.dir).toBe("ltr");
    expect(LOCALE_REGISTRY.en.urlSlug).toBe("");
  });

  it("emits well-formed BCP 47 tags (FR-2)", () => {
    for (const code of LOCALES) {
      expect(LOCALE_REGISTRY[code].htmlLang).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{3})?$/);
    }
    expect(LOCALE_REGISTRY.pa.htmlLang).toBe("pa-Arab");
  });

  it("restricts hreflang to codes Google accepts: en, ur, ps, sd (FR-22)", () => {
    expect(HREFLANG_LOCALES.map((code) => LOCALE_REGISTRY[code].hreflang).sort()).toEqual([
      "en",
      "ps",
      "sd",
      "ur",
    ]);
    for (const code of ["pa", "skr", "bal", "hno"] as const) {
      expect(LOCALE_REGISTRY[code].hreflang).toBeNull();
    }
  });
});

describe("splitLocalePrefix", () => {
  it.each([
    ["/", null, "/"],
    ["/features", null, "/features"],
    ["/features/", null, "/features"],
    ["/urdu-market", null, "/urdu-market"],
    ["/ur", "ur", "/"],
    ["/ur/", "ur", "/"],
    ["/ur/features", "ur", "/features"],
    ["/pa-Arab/features", null, "/pa-Arab/features"],
  ] as const)("parses %s → locale=%s rest=%s", (input, locale, rest) => {
    expect(splitLocalePrefix(input)).toEqual({ locale, rest });
  });
});

describe("localeHref", () => {
  it("keeps English links bare (FR-4)", () => {
    expect(localeHref("en", "/login")).toBe("/login");
    expect(localeHref(DEFAULT_LOCALE, "/")).toBe("/");
  });

  it("prefixes localized links without double slashes (FR-3)", () => {
    expect(localeHref("ur", "/")).toBe("/ur");
    expect(localeHref("ur", "/features")).toBe("/ur/features");
    expect(localeHref("hno", "/signup")).toBe("/hno/signup");
  });
});

describe("switchedPathname", () => {
  it("re-slugs prefixed paths and never navigates home (FR-6)", () => {
    expect(switchedPathname("/skr/why-agropioo", "en")).toBe("/why-agropioo");
    expect(switchedPathname("/ur/features", "sd")).toBe("/sd/features");
    expect(switchedPathname("/ur", "ps")).toBe("/ps");
  });

  it("adds a prefix when switching away from bare English", () => {
    expect(switchedPathname("/features", "ur")).toBe("/ur/features");
    expect(switchedPathname("/", "bal")).toBe("/bal");
  });
});

describe("resolveString", () => {
  const primary = { greeting: "سلام", empty: "", blank: "   " };
  const fallback = { greeting: "Greetings", empty: "Hello", blank: "Seed" };

  it("prefers the localized value", () => {
    expect(resolveString(primary, fallback, "greeting")).toEqual({
      text: "سلام",
      isFallback: false,
    });
  });

  it("falls back to English on empty/blank values (FR-12)", () => {
    expect(resolveString(primary, fallback, "empty").isFallback).toBe(true);
    expect(resolveString(primary, fallback, "empty").text).toBe("Hello");
    expect(resolveString(primary, fallback, "blank").text).toBe("Seed");
  });

  it("returns empty text — never raw keys — when both tables miss (FR-12)", () => {
    expect(resolveString(primary, fallback, "unknown-key")).toEqual({
      text: "",
      isFallback: true,
    });
  });
});

describe("formatMessage", () => {
  it("substitutes named placeholders", () => {
    expect(formatMessage("{count} acres in {district}", { count: 12, district: "Multan" })).toBe(
      "12 acres in Multan",
    );
  });

  it("leaves unknown placeholders visible rather than crashing", () => {
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
  });
});
