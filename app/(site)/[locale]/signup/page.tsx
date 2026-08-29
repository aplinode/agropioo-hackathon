import type { Metadata } from "next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import SignupForm, { type SignupErrorCopy, type SignupCopy } from "./signup-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { t } = await getCurrentDictionary((await params).locale);
  return {
    title: t("su.meta.title").text,
    description: t("su.meta.description").text,
  };
}

export default async function SignupPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { t } = await getCurrentDictionary((await params).locale);
  const switcherLabel = t("common.languageSwitcherLabel").text;

  const errors: SignupErrorCopy & {
    nameRequired: string;
    passwordRequired: string;
    passwordMin: string;
    passwordMax: string;
    phoneInvalid: string;
    confirmRequired: string;
    termsRequired: string;
    passwordMismatch: string;
  } = {
    emailRequired: t("auth.err.emailRequired").text,
    emailInvalid: t("auth.err.emailInvalid").text,
    tooManyAttempts: t("auth.err.tooManyAttempts").text,
    serverError: t("auth.err.serverError").text,
    nameRequired: t("auth.err.nameRequired").text,
    passwordRequired: t("auth.err.passwordRequired").text,
    passwordMin: t("auth.err.passwordMin").text,
    passwordMax: t("auth.err.passwordMax").text,
    phoneInvalid: t("auth.err.phoneInvalid").text,
    confirmRequired: t("auth.err.confirmRequired").text,
    termsRequired: t("auth.err.termsRequired").text,
    passwordMismatch: t("auth.err.passwordMismatch").text,
  };

  const copy: SignupCopy = {
    productOf: t("common.productOfAplinode").text,
    brandHeadingA: t("su.brand.headingA").text,
    brandHeadingB: t("su.brand.headingB").text,
    profileAria: t("su.profile.aria").text,
    profileBadge: t("su.profile.badge").text,
    profileRows: [
      { label: t("su.profile.district").text, value: t("su.profile.districtValue").text },
      { label: t("su.profile.crop").text, value: t("su.profile.cropValue").text },
      { label: t("su.profile.language").text, value: t("su.profile.langValue").text },
    ],
    includedPoints: [
      t("su.included1").text,
      t("su.included2").text,
      t("su.included3").text,
    ],
    backHome: t("auth.backHome").text,
    eyebrow: t("su.eyebrow").text,
    heading: t("su.heading").text,
    sub: t("su.sub").text,
    registeredTitle: t("su.registered.title").text,
    registeredBody: t("su.registered.body").text,
    signIn: t("nav.signIn").text,
    resetPassword: t("su.registered.reset").text,
    nameLabel: t("su.name.label").text,
    namePlaceholder: t("su.name.placeholder").text,
    emailLabel: t("auth.emailLabel").text,
    emailPlaceholder: t("auth.emailPlaceholder").text,
    phoneLabel: t("su.phone.label").text,
    phoneOptional: t("su.phone.optional").text,
    phonePlaceholder: t("su.phone.placeholder").text,
    phoneNote: t("su.phone.note").text,
    passwordLabel: t("auth.passwordLabel").text,
    passwordPlaceholder: t("su.password.placeholder").text,
    confirmPasswordLabel: t("su.confirm.label").text,
    confirmPasswordPlaceholder: t("su.confirm.placeholder").text,
    showPassword: t("auth.showPassword").text,
    hidePassword: t("auth.hidePassword").text,
    strengthLabels: [
      t("su.strength0").text,
      t("su.strength1").text,
      t("su.strength2").text,
      t("su.strength3").text,
    ],
    termsPrefix: t("su.terms.prefix").text,
    termsTos: t("su.terms.tos").text,
    termsAnd: t("su.terms.and").text,
    termsPrivacy: t("su.terms.privacy").text,
    termsEnd: t("su.terms.end").text,
    submit: t("su.submit").text,
    submitting: t("su.submitting").text,
    haveAccount: t("su.haveAccount").text,
    footerStrip: t("home.footer.motto").text,
    errors,
  };

  return (
    <div className="relative">
      <div className="absolute end-5 top-5 z-20 sm:end-8 sm:top-8">
        <LanguageSwitcher label={switcherLabel} />
      </div>
      <SignupForm copy={copy} />
    </div>
  );
}
