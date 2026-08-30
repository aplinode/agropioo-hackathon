import { describe, it, expect } from "vitest";
import { detectSaveSchema } from "@/lib/validation/detect";

describe("detectSaveSchema", () => {
  it("accepts valid input", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "550e8400-e29b-41d4-a716-446655440000",
      farmId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid scanId", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "not-a-uuid",
      farmId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid farmId", () => {
    const result = detectSaveSchema.safeParse({
      scanId: "550e8400-e29b-41d4-a716-446655440000",
      farmId: "also-not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(detectSaveSchema.safeParse({}).success).toBe(false);
  });
});
