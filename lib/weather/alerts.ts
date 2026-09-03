import "server-only";

import nodemailer from "nodemailer";

import { query, queryOne } from "@/lib/db";
import type { ForecastResult, ForecastHour } from "./openweather";

/* Alert rule engine (research §3). Scans the near-term forecast window for
   yield-threatening conditions, deduplicates per condition type per farm within a
   6-hour window, persists in-app notifications, and emails the farmer. */

export type AlertType = "heavy_rain" | "frost" | "extreme_heat" | "disease_risk";
export type AlertSeverity = "warning" | "critical";

export type AlertCondition = {
  type: AlertType;
  severity: AlertSeverity;
  recommendationKey: string;
  conditionMet: Record<string, number>;
};

export type WeatherAlertRow = {
  id: string;
  farm_id: string;
  account_id: string;
  alert_type: AlertType;
  condition_met: Record<string, number>;
  recommendation: string;
  recommendation_key: string;
  severity: AlertSeverity;
  sent_via: string[];
  sent_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};

const RECOMMENDATION_KEYS: Record<AlertType, string> = {
  heavy_rain: "app.weather.alerts.heavyRain",
  frost: "app.weather.alerts.frost",
  extreme_heat: "app.weather.alerts.extremeHeat",
  disease_risk: "app.weather.alerts.diseaseRisk",
};

/* Scan the next ~24 hours (8 × 3-hour steps) for imminent threats. */
export function scanAlertConditions(forecast: ForecastResult): AlertCondition[] {
  const seen = new Set<AlertType>();
  const found: AlertCondition[] = [];

  for (const step of forecast.hourly.slice(0, 8)) {
    if (step.precip_mm >= 10 && !seen.has("heavy_rain")) {
      seen.add("heavy_rain");
      found.push({
        type: "heavy_rain",
        severity: step.precip_mm >= 20 ? "critical" : "warning",
        recommendationKey: RECOMMENDATION_KEYS.heavy_rain,
        conditionMet: { precip_mm: step.precip_mm, temp_c: step.temp_c },
      });
    }
    if (step.temp_c < 2 && !seen.has("frost")) {
      seen.add("frost");
      found.push({
        type: "frost",
        severity: "warning",
        recommendationKey: RECOMMENDATION_KEYS.frost,
        conditionMet: { temp_c: step.temp_c },
      });
    }
    if (step.temp_c > 40 && !seen.has("extreme_heat")) {
      seen.add("extreme_heat");
      found.push({
        type: "extreme_heat",
        severity: "critical",
        recommendationKey: RECOMMENDATION_KEYS.extreme_heat,
        conditionMet: { temp_c: step.temp_c },
      });
    }
    if (
      step.humidity >= 80 &&
      step.temp_c >= 20 &&
      step.temp_c <= 30 &&
      !seen.has("disease_risk")
    ) {
      seen.add("disease_risk");
      found.push({
        type: "disease_risk",
        severity: "warning",
        recommendationKey: RECOMMENDATION_KEYS.disease_risk,
        conditionMet: { humidity: step.humidity, temp_c: step.temp_c },
      });
    }
  }
  return found;
}

/* Scan each day of the forecast for conditions that warrant an avoid-action alert.
   Returns a map of date -> alert conditions (one per alert type per day). */
export function scanDailyAlertConditions(forecast: ForecastResult): Record<string, AlertCondition[]> {
  const byDay: Record<string, AlertCondition[]> = {};
  const hourlyByDay: Record<string, ForecastHour[]> = {};

  for (const h of forecast.hourly) {
    const date = h.time.slice(0, 10);
    if (!hourlyByDay[date]) hourlyByDay[date] = [];
    hourlyByDay[date].push(h);
  }

  for (const [date, hours] of Object.entries(hourlyByDay)) {
    const seen = new Set<AlertType>();
    const alerts: AlertCondition[] = [];

    for (const step of hours) {
      if (step.precip_mm >= 5 && !seen.has("heavy_rain")) {
        seen.add("heavy_rain");
        alerts.push({
          type: "heavy_rain",
          severity: step.precip_mm >= 15 ? "critical" : "warning",
          recommendationKey: RECOMMENDATION_KEYS.heavy_rain,
          conditionMet: { precip_mm: step.precip_mm, temp_c: step.temp_c },
        });
      }
      if (step.temp_c < 5 && !seen.has("frost")) {
        seen.add("frost");
        alerts.push({
          type: "frost",
          severity: "warning",
          recommendationKey: RECOMMENDATION_KEYS.frost,
          conditionMet: { temp_c: step.temp_c },
        });
      }
      if (step.temp_c > 38 && !seen.has("extreme_heat")) {
        seen.add("extreme_heat");
        alerts.push({
          type: "extreme_heat",
          severity: "critical",
          recommendationKey: RECOMMENDATION_KEYS.extreme_heat,
          conditionMet: { temp_c: step.temp_c },
        });
      }
      if (step.humidity >= 80 && step.temp_c >= 20 && step.temp_c <= 30 && !seen.has("disease_risk")) {
        seen.add("disease_risk");
        alerts.push({
          type: "disease_risk",
          severity: "warning",
          recommendationKey: RECOMMENDATION_KEYS.disease_risk,
          conditionMet: { humidity: step.humidity, temp_c: step.temp_c },
        });
      }
    }

    if (alerts.length > 0) {
      byDay[date] = alerts;
    }
  }

  return byDay;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
}

async function sendAlertEmail(to: string, subject: string, body: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter || !process.env.EMAIL_FROM) return false;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: body,
    });
    return true;
  } catch {
    // One retry on transient SMTP failure (research §3).
    try {
      await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body });
      return true;
    } catch {
      return false;
    }
  }
}

type AlertFarm = { farm_id: string; account_id: string; farm_name: string };

/**
 * Scan a farm's forecast, dedupe within the 6-hour window, persist new alerts,
 * and email the farmer. Returns the rows that were newly created.
 */
export async function runAlertScan(
  farm: AlertFarm,
  forecast: ForecastResult,
  resolve: (key: string) => string,
  accountEmail: string | null,
): Promise<WeatherAlertRow[]> {
  const conditions = scanAlertConditions(forecast);
  if (conditions.length === 0) return [];

  const created: WeatherAlertRow[] = [];
  for (const condition of conditions) {
    const recent = await queryOne<{ id: string }>(
      `SELECT id FROM weather_alerts
       WHERE farm_id = $1 AND alert_type = $2 AND created_at > now() - interval '6 hours'`,
      [farm.farm_id, condition.type],
    );
    if (recent) continue;

    const recommendation = resolve(condition.recommendationKey);
    const row = await queryOne<WeatherAlertRow>(
      `INSERT INTO weather_alerts (
         farm_id, account_id, alert_type, condition_met,
         recommendation, recommendation_key, severity, sent_via
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        farm.farm_id,
        farm.account_id,
        condition.type,
        JSON.stringify(condition.conditionMet),
        recommendation,
        condition.recommendationKey,
        condition.severity,
        JSON.stringify(["in_app"]),
      ],
    );
    if (!row) continue;

    let sentVia = ["in_app"] as string[];
    if (accountEmail) {
      const subject = `Agropioo weather alert — ${condition.type.replace(/_/g, " ")}`;
      const ok = await sendAlertEmail(accountEmail, subject, recommendation);
      if (ok) {
        sentVia = ["in_app", "email"];
        await query(
          `UPDATE weather_alerts SET sent_via = $1, sent_at = now() WHERE id = $2`,
          [JSON.stringify(sentVia), row.id],
        );
        row.sent_via = sentVia;
        row.sent_at = new Date().toISOString();
      }
    }
    created.push(row);
  }
  return created;
}
