/* nodemailer singleton (plan: Library parameters). The transporter reports
   itself unconfigured when any SMTP variable is missing; codes are only
   revealed as a demo banner when SMTP is unconfigured AND DEMO_MODE=true
   (FR17) — either condition missing means codes NEVER render anywhere. */

import nodemailer, { type Transporter } from "nodemailer";
import { EMAIL_COPY } from "@/lib/auth/copy";

let transporter: Transporter | null = null;

export type CodePurpose = "verify" | "reset";

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.EMAIL_FROM,
  );
}

function getTransporter(): Transporter | null {
  if (!smtpConfigured()) return null;
  if (transporter) return transporter;
  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}

export type SendCodeResult = { delivered: boolean; demoCode?: string };

/**
 * Sends the 6-digit code by email.
 * - SMTP configured → real send; never returns demoCode.
 * - SMTP missing + DEMO_MODE=true → nothing sent; demoCode echoed for the
 *   clearly-labelled banner (FR17).
 * - SMTP missing without DEMO_MODE → delivery failure; caller shows the
 *   neutral retry message and renders nothing (FR16).
 */
export async function sendCode(
  purpose: CodePurpose,
  email: string,
  code: string,
): Promise<SendCodeResult> {
  const configured = smtpConfigured();
  const demoMode = process.env.DEMO_MODE === "true";

  if (!configured && demoMode) {
    return { delivered: false, demoCode: code };
  }
  if (!configured) {
    return { delivered: false };
  }

  const mailer = getTransporter();
  if (!mailer) return { delivered: false };

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject:
        purpose === "verify" ? EMAIL_COPY.verifySubject : EMAIL_COPY.resetSubject,
      text:
        purpose === "verify"
          ? EMAIL_COPY.verifyBody(code)
          : EMAIL_COPY.resetBody(code),
    });
    return { delivered: true };
  } catch (error) {
    // Log the failure server-side only; responses stay neutral (FR16/FR31).
    console.error("[mailer] send failed:", error instanceof Error ? error.message : error);
    return { delivered: false };
  }
}
