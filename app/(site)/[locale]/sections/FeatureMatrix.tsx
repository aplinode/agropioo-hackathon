import { localized } from "@/lib/i18n/localized";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export default async function FeatureMatrix({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const tiers = [
    {
      index: "T1",
      name: L("home.matrix.tier1Name"),
      badge: L("home.matrix.tier1Badge"),
      cardClass: "border border-agro-clay bg-white",
      headerClass: "border-b border-agro-clay bg-agro-mint/60",
      badgeClass: "border border-agro-clay bg-white text-agro-slate",
      featureCard: "border border-agro-clay/80 bg-white hover:border-agro-canopy/40",
      numClass: "text-agro-canopy/50",
      titleClass: "text-agro-ink group-hover:text-agro-canopy",
      descClass: "text-agro-slate",
      features: [
        { title: L("home.matrix.t1f1Title"), description: L("home.matrix.t1f1Body") },
        { title: L("home.matrix.t1f2Title"), description: L("home.matrix.t1f2Body") },
        { title: L("home.matrix.t1f3Title"), description: L("home.matrix.t1f3Body") },
        { title: L("home.matrix.t1f4Title"), description: L("home.matrix.t1f4Body") },
      ],
    },
    {
      index: "T2",
      name: L("home.matrix.tier2Name"),
      badge: L("home.matrix.tier2Badge"),
      cardClass: "border border-agro-sprout bg-white shadow-sm",
      headerClass: "border-b border-agro-sprout/70 bg-agro-mint",
      badgeClass: "border border-agro-canopy/30 bg-agro-canopy text-white",
      featureCard: "border border-agro-sprout/70 bg-agro-mint/50 hover:border-agro-canopy/40",
      numClass: "text-agro-canopy/50",
      titleClass: "text-agro-ink group-hover:text-agro-canopy",
      descClass: "text-agro-slate",
      features: [
        { title: L("home.matrix.t2f1Title"), description: L("home.matrix.t2f1Body") },
        { title: L("home.matrix.t2f2Title"), description: L("home.matrix.t2f2Body") },
        { title: L("home.matrix.t2f3Title"), description: L("home.matrix.t2f3Body") },
        { title: L("home.matrix.t2f4Title"), description: L("home.matrix.t2f4Body") },
        { title: L("home.matrix.t2f5Title"), description: L("home.matrix.t2f5Body") },
      ],
    },
    {
      index: "T3",
      name: L("home.matrix.tier3Name"),
      badge: L("home.matrix.tier3Badge"),
      cardClass: "border border-agro-forest bg-agro-forest text-white shadow-lg",
      headerClass: "border-b border-white/10 bg-white/5",
      badgeClass: "border border-agro-sprout/40 bg-agro-leaf/20 text-agro-sprout",
      featureCard: "border border-white/15 bg-white/5 hover:border-agro-sprout/40",
      numClass: "text-agro-sprout/60",
      titleClass: "text-white group-hover:text-agro-sprout",
      descClass: "text-agro-sprout/75",
      features: [
        { title: L("home.matrix.t3f1Title"), description: L("home.matrix.t3f1Body") },
        { title: L("home.matrix.t3f2Title"), description: L("home.matrix.t3f2Body") },
        { title: L("home.matrix.t3f3Title"), description: L("home.matrix.t3f3Body") },
        { title: L("home.matrix.t3f4Title"), description: L("home.matrix.t3f4Body") },
        { title: L("home.matrix.t3f5Title"), description: L("home.matrix.t3f5Body") },
      ],
    },
  ];

  return (
    <section
      id="matrix"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            {L("home.matrix.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("home.matrix.title")}
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            {L("home.matrix.subtitle")}
          </p>
        </div>

        <div className="mt-14 space-y-8">
          {tiers.map((tier) => (
            <article key={tier.index} className={`reveal overflow-hidden rounded-2xl ${tier.cardClass}`}>
              {/* Tier header */}
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-5 sm:px-8 ${tier.headerClass}`}>
                <span className="font-mono text-xs font-semibold tracking-[0.22em] opacity-80">
                  {tier.index}
                </span>
                <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                  {tier.name}
                </h3>
                <span
                  className={`ms-auto inline-flex items-center rounded-full px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${tier.badgeClass}`}
                >
                  {tier.badge}
                </span>
                <span className="hidden w-full font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-60 sm:inline sm:w-auto">
                  {String(tier.features.length).padStart(2, "0")} {t("home.matrix.capabilitiesLabel").text}
                </span>
              </div>

              {/* Feature grid */}
              <ul className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:gap-x-8">
                {tier.features.map((feature, i) => (
                  <li
                    key={i}
                    className={`group rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${tier.featureCard}`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className={`font-mono text-xs tracking-widest ${tier.numClass}`} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h4 className={`font-semibold tracking-tight transition-colors duration-300 ${tier.titleClass}`}>
                        {feature.title}
                      </h4>
                    </div>
                    <p className={`mt-2 ps-8 text-sm leading-relaxed ${tier.descClass}`}>
                      {feature.description}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
