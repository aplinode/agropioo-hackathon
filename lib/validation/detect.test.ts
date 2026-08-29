import { describe, it, expect } from "vitest";
import { detectSaveSchema } from "@/lib/validation/detect";

describe("detectSaveSchema", () => {
  it("accepts valid input", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "00000000-0000-0000-0000-000000000000",
      farmId: "11111111-1111-1111-1111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid scanId", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "not-a-uuid",
      farmId: "11111111-1111-1111-1111-111111111111",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid farmId", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "00000000-0000-0000-0000-000000000000",
      farmId: "also-not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(detectSaveSchema.safeParse({}).success).toBe(false);
  });
});
