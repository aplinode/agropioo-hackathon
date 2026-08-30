/**
 * Price alert evaluation and email notification dispatcher.
 * Triggers sell-only alerts when market price reaches or exceeds target.
 */

import { query, withTransaction } from "@/lib/db";
import { createTransport, type Transporter } from "nodemailer";

export interface ActiveAlert {
  id: string;
  user_id: string;
  email: string;
  crop_id: string;
  crop_name_en: string;
  mandi_id: string | null;
  target_price_pkr: number;
}

export interface PriceTrigger {
  crop_id: string;
  mandi_id: string;
  mandi_name_en: string;
  modal_price: number;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete.");
  }

  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export function alertDeepLink(cropId: string, mandiId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/prices?crop=${encodeURIComponent(cropId)}&mandi=${encodeURIComponent(mandiId)}`;
}

export async function sendPriceAlertEmail(
  alert: ActiveAlert,
  trigger: PriceTrigger
): Promise<void> {
  const trans = getTransporter();
  const from = process.env.SMTP_FROM ?? "AgriPioo Notifications <no-reply@agropioo.pk>";
  const link = alertDeepLink(trigger.crop_id, trigger.mandi_id);
  const price = Number(trigger.modal_price).toLocaleString("en-PK");
  const target = Number(alert.target_price_pkr).toLocaleString("en-PK");

  await trans.sendMail({
    from,
    to: alert.email,
    subject: `${alert.crop_name_en} reached your target price`,
    text:
      `${alert.crop_name_en} at ${trigger.mandi_name_en} is now Rs ${price}/Maund, ` +
      `meeting your target of Rs ${target}/Maund.\n\nView prices: ${link}`,
    html: `
      <p>Assalam-o-Alaikum,</p>
      <p><strong>${alert.crop_name_en}</strong> at <strong>${trigger.mandi_name_en}</strong> is now
      <strong>Rs ${price}/Maund</strong>, meeting your target of <strong>Rs ${target}/Maund</strong>.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;">View Mandi Prices</a></p>
      <p style="color:#64748b;font-size:12px;">AgriPioo price alert</p>
    `,
  });
}

/**
 * Evaluate all active alerts against the latest price for each crop/mandi pair.
 * Inserts in-app notifications and sends emails for triggered alerts.
 */
export async function evaluateAndDispatchAlerts(
  triggeredAt: Date
): Promise<{ evaluated: number; triggered: number }> {
  const alerts = await query<ActiveAlert>(`
    select a.id, a.user_id, u.email, a.crop_id, c.name_en as crop_name_en,
           a.mandi_id, a.target_price_pkr
    from price_alerts a
    join users u on u.id = a.user_id
    join crops c on c.id = a.crop_id
    where a.status = 'active'
  `);

  const latestPrices = await query<PriceTrigger>(`
    select distinct on (crop_id, mandi_id)
           crop_id, mandi_id, m.name_en as mandi_name_en, modal_price
    from mandi_prices p
    join mandis m on m.id = p.mandi_id
    order by crop_id, mandi_id, date desc
  `);

  const priceIndex = new Map<string, PriceTrigger>();
  for (const price of latestPrices) {
    priceIndex.set(`${price.crop_id}:${price.mandi_id}`, price);
  }

  let triggered = 0;

  await withTransaction(async (client) => {
    for (const alert of alerts) {
      const targets: PriceTrigger[] = alert.mandi_id
        ? [priceIndex.get(`${alert.crop_id}:${alert.mandi_id}`)].filter(Boolean) as PriceTrigger[]
        : latestPrices.filter((p) => p.crop_id === alert.crop_id);

      for (const trigger of targets) {
        if (Number(trigger.modal_price) < Number(alert.target_price_pkr)) continue;

        await client.query(
          `insert into notifications (account_id, type, title, body, link_url, pinned, created_at)
           values ($1, 'price_alert', $2, $3, $4, true, $5)`,
          [
            alert.user_id,
            `${alert.crop_name_en} price alert triggered`,
            `${trigger.mandi_name_en}: Rs ${Number(trigger.modal_price).toLocaleString("en-PK")}/Maund`,
            alertDeepLink(alert.crop_id, trigger.mandi_id),
            triggeredAt.toISOString(),
          ]
        );

        await client.query(
          `update price_alerts set last_triggered_at = $1, updated_at = $1 where id = $2`,
          [triggeredAt.toISOString(), alert.id]
        );

        try {
          await sendPriceAlertEmail(alert, trigger);
        } catch (err) {
          console.error("Failed to send alert email", err);
        }

        triggered++;
      }
    }
  });

  return { evaluated: alerts.length, triggered };
}
