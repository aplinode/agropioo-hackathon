/**
 * English source of truth. Every user-visible string on translated surfaces
 * gets a key here; the other seven catalog files must mirror it (enforced by
 * catalog coverage tests and the DB sync script).
 */

export const en = {
  "nav.whyAgropioo": "Why Agropioo",
  "nav.features": "Features",
  "nav.howItWorks": "How it works",
  "nav.vision": "Vision",
  "nav.signIn": "Sign in",
  "nav.getEarlyAccess": "Get early access",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "common.languageSwitcherLabel": "Change language",
} as const;

export type CatalogKey = keyof typeof en;
