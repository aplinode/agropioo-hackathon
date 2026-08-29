import type { Metadata } from "next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import LoginForm, { type AuthErrorCopy, type LoginCopy } from "./login-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("li.meta.title").text,
    description: t("li.meta.description").text,
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { t } = await getCurrentDictionary((await params).locale);
  const switcherLabel = t("common.languageSwitcherLabel").text;

  const errors: AuthErrorCopy = {
    emailRequired: t("auth.err.emailRequired").text,
    emailInvalid: t("auth.err.emailInvalid").text,
    loginPasswordRequired: t("auth.err.loginPasswordRequired").text,
    tooManyAttempts: t("auth.err.tooManyAttempts").text,
    invalidCredentials: t("auth.err.invalidCredentials").text,
    serverError: t("auth.err.serverError").text,
  };

  const copy: LoginCopy = {
    productOf: t("common.productOfAplinode").text,
    brandHeadingA: t("li.brand.headingA").text,
    brandHeadingB: t("li.brand.headingB").text,
    demoAria: t("li.demo.aria").text,
    demoUser: t("li.demo.user").text,
    demoAdvisorLabel: t("li.demo.advisorLabel").text,
    demoAdvisorBody: t("li.demo.advisorBody").text,
    points: [t("li.point1").text, t("li.point2").text, t("li.point3").text],
    backHome: t("auth.backHome").text,
    eyebrow: t("li.eyebrow").text,
    heading: t("li.heading").text,
    sub: t("li.sub").text,
    emailLabel: t("auth.emailLabel").text,
    emailPlaceholder: t("auth.emailPlaceholder").text,
    passwordLabel: t("auth.passwordLabel").text,
    passwordPlaceholder: t("li.passwordPlaceholder").text,
    showPassword: t("auth.showPassword").text,
    hidePassword: t("auth.hidePassword").text,
    forgot: t("li.forgot").text,
    submit: t("nav.signIn").text,
    submitting: t("li.submitting").text,
    noAccount: t("li.noAccount").text,
    noAccountEnd: t("li.noAccountEnd").text,
    createAccount: t("li.createAccount").text,
    footerStrip: t("home.footer.motto").text,
    errors,
  };

  return (
    <div className="relative">
      <div className="absolute end-5 top-5 z-20 sm:end-8 sm:top-8">
        <LanguageSwitcher label={switcherLabel} />
      </div>
      <LoginForm copy={copy} />
    </div>
  );
}
