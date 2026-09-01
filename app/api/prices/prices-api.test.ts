import { describe, expect, it } from "vitest";
import {
  getPricesQuerySchema,
  createPriceSchema,
  predictionQuerySchema,
  alertCreateSchema,
  alertUpdateSchema,
  historyQuerySchema,
} from "@/lib/prices/api-types";

describe("getPricesQuerySchema", () => {
  it("defaults include_bordering to true", () => {
    const parsed = getPricesQuerySchema.parse({});
    expect(parsed.include_bordering).toBe(true);
  });

  it("accepts optional crop_id, district, query", () => {
    const parsed = getPricesQuerySchema.parse({
      crop_id: "crop-1",
      district: "Lahore",
      query: "wheat",
    });
    expect(parsed.crop_id).toBe("crop-1");
    expect(parsed.district).toBe("Lahore");
    expect(parsed.query).toBe("wheat");
  });
});

describe("createPriceSchema", () => {
  const valid = {
    crop_id: "crop-1",
    mandi_id: "mandi-1",
    date: "2026-08-31",
    modal_price: 4500,
    min_price: 4400,
    max_price: 4600,
    is_holiday: false,
  };

  it("accepts a valid payload", () => {
    expect(createPriceSchema.parse(valid)).toEqual(valid);
  });

  it("coerces modal_price from string to number", () => {
    const parsed = createPriceSchema.parse({ ...valid, modal_price: "4500" });
    expect(parsed.modal_price).toBe(4500);
  });

  it("rejects invalid date format", () => {
    expect(
      createPriceSchema.safeParse({ ...valid, date: "31/08/2026" }).success,
    ).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(
      createPriceSchema.safeParse({ ...valid, modal_price: -1 }).success,
    ).toBe(false);
  });
});

describe("predictionQuerySchema", () => {
  it("requires crop_id and mandi_id", () => {
    expect(predictionQuerySchema.safeParse({}).success).toBe(false);
    expect(
      predictionQuerySchema.safeParse({ crop_id: "c1", mandi_id: "m1" }).success,
    ).toBe(true);
  });
});

describe("alertCreateSchema", () => {
  it("defaults status to active", () => {
    const parsed = alertCreateSchema.parse({
      crop_id: "crop-1",
      target_price_pkr: 5000,
    });
    expect(parsed.status).toBe("active");
  });

  it("rejects negative target price", () => {
    expect(
      alertCreateSchema.safeParse({ crop_id: "c1", target_price_pkr: -1 }).success,
    ).toBe(false);
  });
});

describe("alertUpdateSchema", () => {
  it("allows partial updates", () => {
    expect(
      alertUpdateSchema.safeParse({ status: "paused" }).success,
    ).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      alertUpdateSchema.safeParse({ status: "inactive" }).success,
    ).toBe(false);
  });
});

describe("historyQuerySchema", () => {
  it("defaults range to 3M", () => {
    const parsed = historyQuerySchema.parse({
      crop_id: "crop-1",
      mandi_id: "mandi-1",
    });
    expect(parsed.range).toBe("3M");
  });

  it("accepts valid range values", () => {
    for (const range of ["1M", "3M", "6M", "12M"]) {
      expect(
        historyQuerySchema.safeParse({ crop_id: "c1", mandi_id: "m1", range }).success,
      ).toBe(true);
    }
  });
});
