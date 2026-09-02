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
  CLOUDINARY_LOGO_URL: "https://res.cloudinary.com/zvo3skb2/image/upload/logo.png",
  header: `
    <div style="background: linear-gradient(135deg, #013B1F 0%, #1C6428 50%, #3F8839 100%); padding: 32px 24px; text-align: center;">
      <a href="https://agropioo.com" style="text-decoration: none;">
        <img src="https://res.cloudinary.com/zvo3skb2/image/upload/logo.png" alt="Agropioo" style="height: 40px; width: auto; display: block; margin: 0 auto;" />
      </a>
    </div>
  `,
  verifyBody: (code: string) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${EMAIL_TEMPLATE.header}
      <div style="background: #ffffff; margin: -48px 0 24px; padding: 32px; border-radius: 12px; border: 1px solid #C1D8C1; box-shadow: 0 4px 24px rgba(1, 59, 31, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #C1D8C1 0%, #e8f5e9 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🌱</span>
          </div>
        </div>
        <h2 style="color: #013B1F; font-size: 22px; margin: 0 0 16px; text-align: center; font-weight: 600;">Welcome to Agropioo</h2>
        <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; text-align: center;">
          Your verification code is:
        </p>
        <div style="background: #F5F2EC; border: 2px dashed #1C6428; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: 700; color: #013B1F; letter-spacing: 8px; font-family: 'IBM Plex Mono', 'JetBrains Mono', monospace;">${code}</span>
        </div>
        <p style="color: #475569; line-height: 1.6; margin: 0 0 8px; text-align: center; font-size: 14px;">
          This code expires in <strong style="color: #013B1F;">10 minutes</strong>.
        </p>
        <p style="color: #94A3B8; line-height: 1.5; margin: 0; text-align: center; font-size: 13px;">
          If you didn't request this code, simply ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 0 24px 24px;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0; line-height: 1.5;">
          Built with care for Pakistan's farmers
        </p>
      </div>
    </div>
  `,
  resetBody: (code: string) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${EMAIL_TEMPLATE.header}
      <div style="background: #ffffff; margin: -48px 0 24px; padding: 32px; border-radius: 12px; border: 1px solid #C1D8C1; box-shadow: 0 4px 24px rgba(1, 59, 31, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #D4A843 0%, #F5F2EC 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🔐</span>
          </div>
        </div>
        <h2 style="color: #013B1F; font-size: 22px; margin: 0 0 16px; text-align: center; font-weight: 600;">Reset your password</h2>
        <p style="color: #475569; line-height: 1.6; margin: 0 0 24px; text-align: center;">
          Your password reset code is:
        </p>
        <div style="background: #F5F2EC; border: 2px dashed #1C6428; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: 700; color: #013B1F; letter-spacing: 8px; font-family: 'IBM Plex Mono', 'JetBrains Mono', monospace;">${code}</span>
        </div>
        <p style="color: #475569; line-height: 1.6; margin: 0 0 8px; text-align: center; font-size: 14px;">
          This code expires in <strong style="color: #013B1F;">10 minutes</strong>.
        </p>
        <p style="color: #94A3B8; line-height: 1.5; margin: 0; text-align: center; font-size: 13px;">
          If you didn't request a password reset, your password remains unchanged.
        </p>
      </div>
      <div style="text-align: center; padding: 0 24px 24px;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0; line-height: 1.5;">
          Built with care for Pakistan's farmers
        </p>
      </div>
    </div>
  `,
} as const;
