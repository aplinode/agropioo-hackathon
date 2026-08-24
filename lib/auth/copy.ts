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

export const EMAIL_COPY = {
  verifySubject: "Your Agropioo verification code",
  verifyBody: (code: string): string =>
    `Assalam-o-alaikum!\n\nYour Agropioo verification code is ${code}.\nIt expires in 10 minutes. If you didn’t request it, you can ignore this email.\n\n— Agropioo · Built for Pakistan`,
  resetSubject: "Your Agropioo password-reset code",
  resetBody: (code: string): string =>
    `Assalam-o-alaikum!\n\nYour Agropioo password-reset code is ${code}.\nIt expires in 10 minutes. If you didn’t request it, you can ignore this email — your password stays unchanged.\n\n— Agropioo · Built for Pakistan`,
} as const;
