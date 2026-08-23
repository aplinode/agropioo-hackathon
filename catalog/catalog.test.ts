import { describe, expect, it } from "vitest";

import { LOCALES, type Locale } from "../lib/i18n/config";
import { CATALOG, CATALOG_KEYS } from "./index";

describe("catalog structure", () => {
  it("defines a non-empty English value for every key", () => {
    expect(CATALOG_KEYS.length).toBeGreaterThan(0);
    for (const key of CATALOG_KEYS) {
      expect(typeof CATALOG.en[key], `${key} must be a string`).toBe("string");
      expect((CATALOG.en[key] ?? "").trim(), `${key} must be non-empty`).not.toBe("");
    }
  });

  it("never defines keys outside the English source of truth", () => {
    const englishKeys = new Set<string>(CATALOG_KEYS);
    for (const locale of LOCALES) {
      for (const key of Object.keys(CATALOG[locale])) {
        expect(
          englishKeys.has(key),
          `${locale} has stray key "${key}" not present in catalog/en.ts`,
        ).toBe(true);
      }
    }
  });

  it("holds trimmed, non-placeholder values for every provided translation", () => {
    for (const locale of LOCALES.filter((code): code is Exclude<Locale, "en"> => code !== "en")) {
      for (const [key, value] of Object.entries(CATALOG[locale])) {
        expect(value?.trim(), `${locale}/${key} must be non-empty`).not.toBe("");
        expect(value?.trim().startsWith("TODO"), `${locale}/${key} is a placeholder`).toBe(false);
      }
    }
  });
});
