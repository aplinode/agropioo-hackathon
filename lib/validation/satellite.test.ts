import { describe, it, expect } from "vitest";
import {
  saveBoundarySchema,
  bboxAreaHa,
  isWithinPakistan,
  areaExceedsLimit,
} from "@/lib/validation/satellite";

const validGeojson = {
  type: "Polygon" as const,
  coordinates: [
    [
      [73.1, 33.5],
      [73.2, 33.5],
      [73.2, 33.4],
      [73.1, 33.4],
      [73.1, 33.5],
    ],
  ],
};

const pakPolygon = {
  type: "Polygon" as const,
  coordinates: [
    [
      [73.0, 33.5],
      [73.1, 33.5],
      [73.1, 33.4],
      [73.0, 33.4],
      [73.0, 33.5],
    ],
  ],
};

describe("saveBoundarySchema", () => {
  it("accepts a valid closed polygon with UUID farmId", () => {
    const result = saveBoundarySchema.safeParse({
      farmId: "123e4567-e89b-12d3-a456-426614174000",
      geojson: validGeojson,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed UUID", () => {
    const result = saveBoundarySchema.safeParse({
      farmId: "not-a-uuid",
      geojson: validGeojson,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unclosed ring", () => {
    const unclosed = {
      ...validGeojson,
      coordinates: [
        [
          [73.1, 33.5],
          [73.2, 33.5],
          [73.2, 33.4],
          [73.1, 33.4],
        ],
      ],
    };
    const result = saveBoundarySchema.safeParse({
      farmId: "123e4567-e89b-12d3-a456-426614174000",
      geojson: unclosed,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a ring with fewer than 4 coordinate pairs", () => {
    const tooSmall = {
      type: "Polygon" as const,
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 0],
        ],
      ],
    };
    const result = saveBoundarySchema.safeParse({
      farmId: "123e4567-e89b-12d3-a456-426614174000",
      geojson: tooSmall,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-Polygon geometry type", () => {
    const result = saveBoundarySchema.safeParse({
      farmId: "123e4567-e89b-12d3-a456-426614174000",
      geojson: {
        type: "Point" as never,
        coordinates: [73.1, 33.5],
      } as never,
    });
    expect(result.success).toBe(false);
  });
});

describe("bboxAreaHa", () => {
  it("returns a positive area for a valid polygon", () => {
    const area = bboxAreaHa(pakPolygon);
    expect(area).toBeGreaterThan(0);
    expect(area).toBeCloseTo(10270, -1);
  });
});

describe("isWithinPakistan", () => {
  it("returns true for a polygon inside Pakistan", () => {
    expect(isWithinPakistan(pakPolygon)).toBe(true);
  });

  it("returns false for coordinates outside Pakistan", () => {
    const outside = {
      type: "Polygon" as const,
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, -1],
          [0, -1],
          [0, 0],
        ],
      ],
    };
    expect(isWithinPakistan(outside)).toBe(false);
  });
});

describe("areaExceedsLimit", () => {
  it("returns true for areas over 500 ha", () => {
    expect(areaExceedsLimit(501)).toBe(true);
  });

  it("returns false for areas at or under 500 ha", () => {
    expect(areaExceedsLimit(500)).toBe(false);
    expect(areaExceedsLimit(10)).toBe(false);
  });
});
