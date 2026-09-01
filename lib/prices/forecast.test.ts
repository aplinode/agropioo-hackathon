import { describe, expect, it } from "vitest";
import { forecastPrices } from "@/lib/prices/forecast";

describe("forecastPrices", () => {
  it("returns HOLD for a slight uptrend", () => {
    const prices = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, "0")}`,
      modal_price: 5000 + i * 20,
    }));

    const result = forecastPrices(prices);
    expect(result.recommendation).toBe("HOLD");
    expect(result.predictions).toHaveLength(14);
    expect(result.volatility_warning).toBe(false);
    expect(result.model_confidence).toBeGreaterThanOrEqual(0);
    expect(result.model_confidence).toBeLessThanOrEqual(1);
  });

  it("returns SELL for a strong downtrend", () => {
    const prices = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, "0")}`,
      modal_price: 5000 - i * 50,
    }));

    const result = forecastPrices(prices);
    expect(result.recommendation).toBe("SELL");
    expect(result.predictions).toHaveLength(14);
  });

  it("flags volatility warning for sparse data", () => {
    const prices = [
      { date: "2026-08-01", modal_price: 5000 },
      { date: "2026-08-02", modal_price: 5100 },
      { date: "2026-08-03", modal_price: 4800 },
      { date: "2026-08-04", modal_price: 5200 },
      { date: "2026-08-05", modal_price: 4900 },
      { date: "2026-08-06", modal_price: 5300 },
      { date: "2026-08-07", modal_price: 4700 },
    ];

    const result = forecastPrices(prices);
    expect(result.volatility_warning).toBe(true);
  });

  it("handles empty input gracefully", () => {
    const result = forecastPrices([]);
    expect(result.predictions).toHaveLength(14);
    expect(result.recommendation).toBe("SELL");
  });

  it("sorts unsorted input before forecasting", () => {
    const prices = [
      { date: "2026-08-03", modal_price: 5000 },
      { date: "2026-08-01", modal_price: 5000 },
      { date: "2026-08-02", modal_price: 5000 },
    ];

    const result = forecastPrices(prices);
    expect(result.predictions).toHaveLength(14);
    expect(result.predictions[0].predicted_price).toBeGreaterThanOrEqual(0);
  });

  it("includes confidence bands around predictions", () => {
    const prices = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, "0")}`,
      modal_price: 5000,
    }));

    const result = forecastPrices(prices);
    for (const pt of result.predictions) {
      expect(pt.lower_bound).toBeLessThanOrEqual(pt.predicted_price);
      expect(pt.upper_bound).toBeGreaterThanOrEqual(pt.predicted_price);
    }
  });
});
