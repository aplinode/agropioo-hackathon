/* Single home for user-facing auth copy (plan: Copy centralization).
   English at launch; the DB-driven translation layer absorbs these later. */

export const COPY = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  TOO_MANY_ATTEMPTS: "Too many attempts — please try again later.",
  EMAIL_ALREADY_REGISTERED:
    "This email is already registered. Sign in instead or reset your password.",
  CODE_REJECTED: "That code didn’t work. Check the latest email and try again.",
  UNAUTHORIZED_GENERIC: "This request isn’t allowed.",
  VALIDATION_FALLBACK: "Some details need fixing before we can continue.",
  SERVER_ERROR: "Something went wrong on our side. Please try again.",
  DELIVERY_FAILED:
    "We couldn’t send the code right now. Please try resending in a moment.",
} as const;

export const EMAIL_TEMPLATE = {
  verifySubject: "Your Agropioo verification code",
  resetSubject: "Your Agropioo password-reset code",
  header: `
    <div style="background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%); padding: 24px 0; text-align: center;">
      <a href="https://agropioo.com" style="text-decoration: none;">
        <img src="https://agropioo.com/logo.svg" alt="Agropioo" style="height: 32px; width: auto; display: block; margin: 0 auto;" />
      </a>
    </div>
  `,
  verifyBody: (code: string) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: DM Sans, sans-serif;">
      ${EMAIL_TEMPLATE.header}
      <div style="background: #ffffff; margin: -40px 0 24px; padding: 24px; border-radius: 8px; border: 1px solid #e8f5e9;">
        <h2 style="color: #1a472a; font-size: 20px; margin-top: 0;">Hello!</h2>
        <p style="color: #333; line-height: 1.6;">
          Your Agropioo verification code is <strong style="color: #1a472a;">${code}</strong>.<br />
          It expires in 10 minutes. If you didn't request it, you can ignore this email.
        </p>
        <p style="color: #555; font-size: 14px; margin: 24px 0 0;">
          — Agropioo · Built for Pakistan
        </p>
      </div>
    </div>
  `,
  resetBody: (code: string) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: DM Sans, sans-serif;">
      ${EMAIL_TEMPLATE.header}
      <div style="background: #ffffff; margin: -40px 0 24px; padding: 24px; border-radius: 8px; border: 1px solid #e8f5e9;">
        <h2 style="color: #1a472a; font-size: 20px; margin-top: 0;">Hello!</h2>
        <p style="color: #333; line-height: 1.6;">
          Your Agropioo password-reset code is <strong style="color: #1a472a;">${code}</strong>.<br />
          It expires in 10 minutes. If you didn't request it, you can ignore this email — your password stays unchanged.
        </p>
        <p style="color: #555; font-size: 14px; margin: 24px 0 0;">
          — Agropioo · Built for Pakistan
        </p>
      </div>
    </div>
  `,
} as const;
