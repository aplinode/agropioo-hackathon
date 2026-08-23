import { localized } from "@/lib/i18n/localized";
import { getCurrentDictionary } from "@/lib/i18n/server";

export default async function FarmerJourney() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const steps = [
    { title: L("home.journey.step1Title"), description: L("home.journey.step1Body") },
    { title: L("home.journey.step2Title"), description: L("home.journey.step2Body") },
    { title: L("home.journey.step3Title"), description: L("home.journey.step3Body") },
    { title: L("home.journey.step4Title"), description: L("home.journey.step4Body") },
    { title: L("home.journey.step5Title"), description: L("home.journey.step5Body") },
    { title: L("home.journey.step6Title"), description: L("home.journey.step6Body") },
  ];

  return (
    <section
      id="journey"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal justify-center text-agro-canopy">
            {L("home.journey.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("home.journey.title")}
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            {L("home.journey.subtitle")}
          </p>
        </div>

        <ol className="mx-auto mt-16 max-w-2xl">
          {steps.map((step, index) => (
            <li key={index} className="reveal relative pb-10 last:pb-0">
              {index < steps.length - 1 && (
                <span
                  className="absolute bottom-0 start-[22px] top-12 w-px bg-agro-sprout"
                  aria-hidden="true"
                />
              )}
              <div className="flex gap-5 sm:gap-7">
                <span className="z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-agro-canopy bg-agro-mint font-mono text-sm font-bold text-agro-canopy">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pt-1.5">
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-agro-slate">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
