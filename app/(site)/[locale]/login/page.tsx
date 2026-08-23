import type { Metadata } from "next";
import { locale } from "next/root-params";

import { LanguageSwitcher } from "@/components/language-switcher";
import { requireGuestPage } from "@/lib/auth/guards";
import { isLocale, type Locale as LocaleCode } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Agropioo",
  description:
    "Sign in to Agropioo, the AI-powered farm intelligence platform. Your advisor, records, and advisories — waiting where you left them.",
};

export default async function LoginPage() {
  // Signed-in visitors are pushed to the dashboard (FR28).
  await requireGuestPage();

  const raw = await locale();
  const current: LocaleCode = isLocale(raw) ? raw : "en";
  const { t } = await getDictionary(current);
  const switcherLabel = t("common.languageSwitcherLabel").text;

  return (
    <div className="relative">
      <div className="absolute end-5 top-5 z-20 sm:end-8 sm:top-8">
        <LanguageSwitcher label={switcherLabel} />
      </div>
      <LoginForm />
    </div>
  );
}
