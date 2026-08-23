import { describe, expect, it } from "vitest";

import { formatNumber } from "./format";

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
