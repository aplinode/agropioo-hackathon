import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import CtaForm, { type CtaFormStrings } from "./CtaForm";

export default async function CTA({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);

  const strings: CtaFormStrings = {
    emailLabel: t("home.cta.emailLabel").text,
    submit: t("nav.getEarlyAccess").text,
    success: t("home.cta.success").text,
  };

  return (
    <section
      id="get-started"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow flex justify-center text-agro-sprout">
          {t("home.cta.eyebrow").text}
        </p>
        <h2 className="display-heading mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
          {t("home.cta.title").text}
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-agro-sprout/85">
          {t("home.cta.subtitle").text}
        </p>

        <CtaForm strings={strings} />

        <p className="mt-4 font-mono text-xs tracking-wide text-agro-sprout/70">
          {t("home.cta.fineprint").text}
        </p>
      </div>
    </section>
  );
}
