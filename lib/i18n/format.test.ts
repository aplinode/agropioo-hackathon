import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { formatNumber, formatRelativeTime } from "./format";

describe("formatNumber digit policy (FR-19)", () => {
  it("renders Western digits for English", () => {
    expect(formatNumber(3500, "en")).toBe("3,500");
  });

  it.each(["ur", "pa", "ps", "sd", "skr", "bal", "hno"] as const)(
    "renders Eastern Arabic-Indic digits for %s",
    (locale) => {
      const formatted = formatNumber(3500, locale);
      expect(formatted).not.toContain("3");
      expect(formatted).toContain("۳");
      expect(formatted).toContain("۵");
    },
  );

  it("keeps grouping separators consistent across locales", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    expect(formatNumber(1234567, "ur")).toBe("۱٬۲۳۴٬۵۶۷");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-26T00:00:00Z");

  it("says 'now' for < 60 seconds ago", () => {
    const t = new Date("2026-08-25T23:59:30Z");
    expect(formatRelativeTime(t, now, "en")).toBe("now");
  });

  it("says '1 minute ago' for ~75 s", () => {
    const t = new Date("2026-08-25T23:58:45Z");
    expect(formatRelativeTime(t, now, "en")).toBe("1 minute ago");
  });

  it("says '2 hours ago' (EN)", () => {
    const t = new Date("2026-08-25T22:00:00Z");
    expect(formatRelativeTime(t, now, "en")).toBe("2 hours ago");
  });

  it("says 'in 3 days' (future)", () => {
    const t = new Date("2026-08-29T00:00:00Z");
    expect(formatRelativeTime(t, now, "en")).toBe("in 3 days");
  });

  it("uses Eastern Arabic-Indic digits in Urdu", () => {
    const t = new Date("2026-08-25T22:00:00Z");
    const result = formatRelativeTime(t, now, "ur");
    expect(result).toContain("۲"); // 2 in Eastern digits
    expect(result).not.toMatch(/\b2\b/);
  });

  it("works for every registered locale without throwing", () => {
    const t = new Date("2026-08-25T18:00:00Z");
    for (const locale of LOCALES) {
      expect(typeof formatRelativeTime(t, now, locale)).toBe("string");
    }
  });
});
