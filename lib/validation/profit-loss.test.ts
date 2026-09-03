import { describe, it, expect } from "vitest";
import { createSeasonSchema, updateSeasonSchema, createExpenseSchema, updateExpenseSchema, createProjectedCostSchema } from "@/lib/validation/profit-loss";

describe("createSeasonSchema", () => {
  it("accepts valid input", () => {
    const result = createSeasonSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      crop_id: "wheat",
      season: "Summer",
      year: "2024-25",
      acres: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero acres", () => {
    const result = createSeasonSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      crop_id: "wheat",
      season: "Summer",
      year: "2024-25",
      acres: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSeasonSchema", () => {
  it("accepts partial update", () => {
    const result = updateSeasonSchema.safeParse({ expected_yield: 50, expected_price: 100 });
    expect(result.success).toBe(true);
  });
});

describe("createExpenseSchema", () => {
  it("accepts valid expense", () => {
    const result = createExpenseSchema.safeParse({
      season_id: "00000000-0000-0000-0000-000000000000",
      category: "seed",
      amount: 1000,
      date: "2024-05-01",
      note: "Test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = createExpenseSchema.safeParse({
      season_id: "00000000-0000-0000-0000-000000000000",
      category: "seed",
      amount: 0,
      date: "2024-05-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("accepts amount update", () => {
    const result = updateExpenseSchema.safeParse({ amount: 2000 });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = updateExpenseSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("createProjectedCostSchema", () => {
  it("accepts valid projected cost", () => {
    const result = createProjectedCostSchema.safeParse({ category: "seed", per_acre_cost_pkr: 1000 });
    expect(result.success).toBe(true);
  });

  it("rejects zero cost", () => {
    const result = createProjectedCostSchema.safeParse({ category: "seed", per_acre_cost_pkr: 0 });
    expect(result.success).toBe(false);
  });
});
