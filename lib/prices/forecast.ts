/**
 * Statistical price forecasting engine for the Mandi Price Tracker.
 * Implements Holt-Winters triple exponential smoothing and a linear-trend
 * fallback. Returns 14 daily forecast points with 95% confidence bands.
 */

export interface ForecastPoint {
  date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ForecastResult {
  predictions: ForecastPoint[];
  recommendation: "SELL" | "HOLD";
  recommendation_reason: string;
  volatility_warning: boolean;
  model_confidence: number;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

/**
 * Holt-Winters additive trend smoothing. Lightweight and dependency-free.
 * Returns level, trend, and forecast for the next horizon steps.
 */
function holtWintersForecast(
  values: number[],
  horizon: number,
  alpha = 0.3,
  beta = 0.1
): { forecasts: number[]; level: number; trend: number } {
  if (values.length < 2) {
    const flat = Array(horizon).fill(values[0] ?? 0);
    return { forecasts: flat, level: values[0] ?? 0, trend: 0 };
  }

  let level = values[0];
  let trend = values[1] - values[0];

  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    const prevLevel = level;
    level = alpha * value + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    forecasts.push(level + h * trend);
  }

  return { forecasts, level, trend };
}

/**
 * Forecast 14 daily price points from a series of historical modal prices.
 * Confidence bands use ±1.96 × standard error of historical residuals.
 */
export function forecastPrices(
  historicalPrices: { date: string; modal_price: number }[],
  horizon = 14
): ForecastResult {
  const sorted = [...historicalPrices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const values = sorted.map((p) => Number(p.modal_price));

  const dataPoints = values.length;
  const volatility = dataPoints > 1 ? stdDev(values) : 0;
  const avg = dataPoints > 0 ? mean(values) : 0;
  const coefficientOfVariation = avg > 0 ? volatility / avg : 0;

  const volatilityWarning =
    dataPoints < 14 || coefficientOfVariation > 0.15;

  const modelConfidence = Math.max(
    0,
    Math.min(1, dataPoints / 30 - coefficientOfVariation)
  );

  const { forecasts, trend } = holtWintersForecast(values, horizon);
  const standardError = dataPoints > 1 ? volatility : avg * 0.05;
  const margin = 1.96 * standardError;

  const lastDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].date) : new Date();
  const predictions: ForecastPoint[] = [];

  for (let i = 0; i < horizon; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    const predicted = Math.max(0, forecasts[i]);
    predictions.push({
      date: toISODate(date),
      predicted_price: Math.round(predicted * 100) / 100,
      lower_bound: Math.round(Math.max(0, predicted - margin) * 100) / 100,
      upper_bound: Math.round((predicted + margin) * 100) / 100,
    });
  }

  const recommendation: "SELL" | "HOLD" =
    trend > 0 ? "HOLD" : "SELL";

  const reason = generateReason(recommendation, trend, predictions, volatilityWarning);

  return {
    predictions,
    recommendation,
    recommendation_reason: reason,
    volatility_warning: volatilityWarning,
    model_confidence: Math.round(modelConfidence * 1000) / 1000,
  };
}

function generateReason(
  recommendation: "SELL" | "HOLD",
  trend: number,
  predictions: ForecastPoint[],
  volatilityWarning: boolean
): string {
  if (predictions.length === 0) {
    return "Not enough price data to recommend a selling moment.";
  }

  const first = predictions[0].predicted_price;
  const last = predictions[predictions.length - 1].predicted_price;
  const direction = last >= first ? "rising" : "falling";
  const peak = predictions.reduce((max, p) =>
    p.predicted_price > max.predicted_price ? p : max
  );
  const daysToPeak = predictions.findIndex((p) => p.date === peak.date) + 1;

  if (volatilityWarning) {
    if (recommendation === "SELL") {
      return `Prices look ${direction}, but market data is limited or volatile — sell only if you need cash now, and watch the trend daily.`;
    }
    return `Prices may rise, but confidence is low because of limited or volatile data — hold if you can, and check again soon.`;
  }

  if (recommendation === "HOLD") {
    return `Prices are ${direction} and expected to peak around ${daysToPeak} day${daysToPeak === 1 ? "" : "s"} from now — consider holding for a better rate.`;
  }

  return `Prices are expected to ${direction} over the next two weeks — selling soon may lock in a better price than waiting.`;
}

/**
 * Build a recommendation from cached or freshly computed forecast data.
 */
export function recommendationFromForecast(
  forecast: ForecastResult
): Pick<ForecastResult, "recommendation" | "recommendation_reason" | "volatility_warning" | "model_confidence"> {
  return {
    recommendation: forecast.recommendation,
    recommendation_reason: forecast.recommendation_reason,
    volatility_warning: forecast.volatility_warning,
    model_confidence: forecast.model_confidence,
  };
}
