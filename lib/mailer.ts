/* nodemailer singleton (plan: Library parameters). */

import nodemailer, { type Transporter } from "nodemailer";
import { EMAIL_TEMPLATE } from "@/lib/auth/copy";

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

export type SendCodeResult = { delivered: boolean };

export async function sendCode(
  purpose: CodePurpose,
  email: string,
  code: string,
): Promise<SendCodeResult> {
  const configured = smtpConfigured();

  if (!configured) {
    return { delivered: false };
  }

  const mailer = getTransporter();
  if (!mailer) return { delivered: false };

  try {
    const body = purpose === "verify"
      ? EMAIL_TEMPLATE.verifyBody(code)
      : EMAIL_TEMPLATE.resetBody(code);

    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: purpose === "verify" ? EMAIL_TEMPLATE.verifySubject : EMAIL_TEMPLATE.resetSubject,
      html: body,
    });
    return { delivered: true };
  } catch (error) {
    console.error("[mailer] send failed:", error instanceof Error ? error.message : error);
    return { delivered: false };
  }
}
