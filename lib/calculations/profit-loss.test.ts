import { describe, it, expect } from "vitest";
import { computeVariance, computeROI, computeBreakEven, computePL, getSeasonStartDate, getCropUnit } from "@/lib/calculations/profit-loss";

describe("computeVariance", () => {
  it("returns absolute and percentage when projected > 0", () => {
    const result = computeVariance(120, 100);
    expect(result.absolute).toBe(20);
    expect(result.percentage).toBeCloseTo(20, 1);
  });

  it("returns null percentage when projected is 0", () => {
    const result = computeVariance(50, 0);
    expect(result.absolute).toBe(50);
    expect(result.percentage).toBeNull();
  });
});

describe("computeROI", () => {
  it("returns ROI percentage", () => {
    expect(computeROI(150, 100)).toBeCloseTo(50, 1);
  });

  it("returns null when actual cost is 0", () => {
    expect(computeROI(100, 0)).toBeNull();
  });
});

describe("computeBreakEven", () => {
  it("returns break-even yield and price", () => {
    const result = computeBreakEven(100000, 100, 50, 10);
    expect(result?.yield).toContain("units");
    expect(result?.price).toContain("PKR");
  });

  it("returns null when price is 0", () => {
    expect(computeBreakEven(100000, 0, 50, 10)).toBeNull();
  });

  it("returns null when yield is 0", () => {
    expect(computeBreakEven(100000, 100, 0, 10)).toBeNull();
  });
});

describe("computePL", () => {
  it("computes profit status when revenue > cost", () => {
    const result = computePL({ totalProjectedCost: 100, totalActualCost: 80, projectedRevenue: 200, actualRevenue: 200, totalInvestment: 100 });
    expect(result.netProfitLoss).toBe(120);
    expect(result.status).toBe("profit");
  });

  it("computes loss status when revenue < cost", () => {
    const result = computePL({ totalProjectedCost: 100, totalActualCost: 200, projectedRevenue: 0, actualRevenue: 0, totalInvestment: 100 });
    expect(result.netProfitLoss).toBe(-200);
    expect(result.status).toBe("loss");
  });
});

describe("getSeasonStartDate", () => {
  it("returns May 1 for Summer", () => {
    expect(getSeasonStartDate("Summer")).toContain("-05-01");
  });
  it("returns Nov 1 for Winter", () => {
    expect(getSeasonStartDate("Winter")).toContain("-11-01");
  });
  it("returns Jul 1 for Rainy", () => {
    expect(getSeasonStartDate("Rainy")).toContain("-07-01");
  });
  it("returns Jan 1 for Dry", () => {
    expect(getSeasonStartDate("Dry")).toContain("-01-01");
  });
});

describe("getCropUnit", () => {
  it("returns Maund for wheat", () => {
    expect(getCropUnit("wheat")).toBe("Maund");
  });
  it("returns default for unknown crop", () => {
    expect(getCropUnit("unknown")).toBe("Maund");
  });
});
