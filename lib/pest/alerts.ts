import "server-only";

import { query, queryOne } from "@/lib/db";
import { buildRecommendation } from "./recommendations";
import type { PredictionResult } from "./model";

export type PestAlertRow = {
  id: string;
  farm_id: string;
  account_id: string;
  pest_type: string;
  risk_score: number;
  severity: "warning" | "critical";
  recommendation_text: string;
  recommendation_key: string | null;
  recommendation_translation_key: string | null;
  sent_via: string[];
  sent_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  escalation_of_id: string | null;
  created_at: string;
};

const ESCALATION_WINDOW_HOURS = 6;
const RISK_THRESHOLD = 70;

export async function scanAndAlert(
  accountId: string,
  farmId: string,
  farmName: string,
  crop: string,
  predictions: PredictionResult[],
  locale: string,
): Promise<PestAlertRow[]> {
  const created: PestAlertRow[] = [];
  const alertedPests = new Map<string, { id: string; riskScore: number; createdAt: string }>();

  const existingRecent = await query<{ id: string; pest_type: string; risk_score: number; created_at: string }>(
    `SELECT id, pest_type, risk_score, created_at FROM pest_alerts WHERE farm_id = $1 AND created_at > now() - interval '${ESCALATION_WINDOW_HOURS} hours'`,
    [farmId],
  );
  for (const row of existingRecent) {
    alertedPests.set(row.pest_type, { id: row.id, riskScore: row.risk_score, createdAt: row.created_at });
  }

  for (const pred of predictions) {
    if (pred.riskScore < RISK_THRESHOLD || !pred.predictedPest) continue;
    const pest = pred.predictedPest;
    const recent = alertedPests.get(pest);

    if (recent) {
      if (pred.riskScore > recent.riskScore) {
        const escalation = await createAlert(accountId, farmId, pest, pred.riskScore, locale, farmName, crop, recent.id);
        if (escalation) created.push(escalation);
        alertedPests.set(pest, { id: escalation!.id, riskScore: pred.riskScore, createdAt: new Date().toISOString() });
      }
      continue;
    }

    const alert = await createAlert(accountId, farmId, pest, pred.riskScore, locale, farmName, crop, null);
    if (alert) {
      created.push(alert);
      alertedPests.set(pest, { id: alert.id, riskScore: pred.riskScore, createdAt: alert.created_at });
    }
  }

  return created;
}

async function createAlert(
  accountId: string,
  farmId: string,
  pest: string,
  riskScore: number,
  locale: string,
  farmName: string,
  crop: string,
  escalationOfId: string | null,
): Promise<PestAlertRow | null> {
  const severity: "warning" | "critical" = riskScore >= 85 ? "critical" : "warning";
  const { text, translationKey } = await buildRecommendation(pest, locale, farmName, crop);

  const row = await queryOne<PestAlertRow>(
    `INSERT INTO pest_alerts (farm_id, account_id, pest_type, risk_score, severity, recommendation_text, recommendation_key, recommendation_translation_key, sent_via, escalation_of_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [farmId, accountId, pest, riskScore, severity, text, `app.pest.alerts.${pest}`, translationKey, JSON.stringify(["in_app"]), escalationOfId],
  );
  if (!row) return null;

  await query(
    `INSERT INTO notifications (account_id, type, title, body, link_url) VALUES ($1,$2,$3,$4,$5)`,
    [accountId, "pest_alert", `${pest.charAt(0).toUpperCase() + pest.slice(1)} — ${riskScore}% risk`, text, `/pest/history/${row.id}`],
  );

  const accountRow = await queryOne<{ email: string }>(`SELECT email FROM users WHERE id = $1`, [accountId]);
  const accountEmail = accountRow?.email ?? null;

  const transporter = getTransporter();
  if (transporter && process.env.EMAIL_FROM && accountEmail) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: accountEmail,
        subject: `Pest alert: ${pest} risk at ${Math.round(riskScore)}%`,
        text,
      });
      await query(
        `UPDATE pest_alerts SET sent_via = $1, sent_at = now() WHERE id = $2`,
        [JSON.stringify(["in_app", "email"]), row.id],
      );
      return { ...row, sent_via: ["in_app", "email"], sent_at: new Date().toISOString() };
    } catch {
      // email failed; in-app alert already stored
    }
  }

  return row;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const auth = process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined;
  return {
    sendMail: async (opts: { to: string; subject: string; text: string }) => {
      // Minimal transport wrapper for pest alerts.
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth });
      return transport.sendMail({ ...opts, from: process.env.EMAIL_FROM });
    },
  } as unknown as ReturnType<typeof import("nodemailer").createTransport>;
}
