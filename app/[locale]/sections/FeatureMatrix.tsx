const tiers = [
  {
    index: "T1",
    name: "Must-Have",
    badge: "Baseline",
    cardClass: "border border-agro-clay bg-white",
    headerClass: "border-b border-agro-clay bg-agro-mint/60",
    badgeClass: "border border-agro-clay bg-white text-agro-slate",
    featureCard: "border border-agro-clay/80 bg-white hover:border-agro-canopy/40",
    numClass: "text-agro-canopy/50",
    titleClass: "text-agro-ink group-hover:text-agro-canopy",
    descClass: "text-agro-slate",
    features: [
      {
        title: "AI crop disease detection",
        description:
          "Upload a photo of an affected leaf and get instant disease diagnosis, severity, and treatment recommendations.",
      },
      {
        title: "Satellite field monitoring",
        description:
          "Mark your field boundary and view NDVI-based crop health zones from free Sentinel-2 imagery.",
      },
      {
        title: "Smart weather advisory",
        description:
          "Hyperlocal forecasts combined with your crop and growth stage become daily, actionable advice.",
      },
      {
        title: "Mandi price tracker & predictor",
        description:
          "Track nearby market prices with AI trend predictions, so you sell at the right time.",
      },
    ],
  },
  {
    index: "T2",
    name: "Differentiators",
    badge: "Stand out",
    cardClass: "border border-agro-sprout bg-white shadow-sm",
    headerClass: "border-b border-agro-sprout/70 bg-agro-mint",
    badgeClass: "border border-agro-canopy/30 bg-agro-canopy text-white",
    featureCard: "border border-agro-sprout/70 bg-agro-mint/50 hover:border-agro-canopy/40",
    numClass: "text-agro-canopy/50",
    titleClass: "text-agro-ink group-hover:text-agro-canopy",
    descClass: "text-agro-slate",
    features: [
      {
        title: "Regional language voice chatbot",
        description:
          "Speak or type in Urdu, Punjabi, Saraiki, and more — hear answers in the language you understand best.",
      },
      {
        title: "Government scheme matcher",
        description:
          "Enter your profile and discover every scheme you qualify for, with documents and apply links.",
      },
      {
        title: "Crop recommendation engine",
        description:
          "The most profitable crop for your soil, weather, market demand, and budget this season.",
      },
      {
        title: "Farm profit / loss calculator",
        description:
          "Expected and actual costs, yield, revenue, and profit — with break-even and ROI insights.",
      },
      {
        title: "Community forum + expert connect",
        description:
          "Post questions, share photos, get answers from fellow farmers and verified agriculture experts.",
      },
    ],
  },
  {
    index: "T3",
    name: "Wow Factor",
    badge: "Ahead of the field",
    cardClass: "border border-agro-forest bg-agro-forest text-white shadow-lg",
    headerClass: "border-b border-white/10 bg-white/5",
    badgeClass: "border border-agro-sprout/40 bg-agro-leaf/20 text-agro-sprout",
    featureCard: "border border-white/15 bg-white/5 hover:border-agro-sprout/40",
    numClass: "text-agro-sprout/60",
    titleClass: "text-white group-hover:text-agro-sprout",
    descClass: "text-agro-sprout/75",
    features: [
      {
        title: "Satellite change detection",
        description:
          "Compare satellite images over time with a slider to track growth, damage, or encroachment.",
      },
      {
        title: "AI pest outbreak prediction",
        description:
          "Early warnings ahead of likely pest attacks, based on weather, crop stage, and history.",
      },
      {
        title: "Voice-first phone call mode",
        description:
          "Dial a toll-free number, speak your question, hear advice in your language — no smartphone needed.",
      },
      {
        title: "Carbon credit estimator",
        description:
          "Log sustainable practices and estimate carbon credits from voluntary markets.",
      },
      {
        title: "Offline-first PWA + SMS alerts",
        description:
          "Works offline in the field, syncs when connected, alerts via SMS when data is spotty.",
      },
    ],
  },
];

export default function FeatureMatrix() {
  return (
    <section
      id="matrix"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            Full capability stack
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            From must-haves to marvels
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            Every feature protects crops, cuts costs, or grows income. Read it
            like an almanac — each tier builds on the last.
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
                  className={`ml-auto inline-flex items-center rounded-full px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${tier.badgeClass}`}
                >
                  {tier.badge}
                </span>
                <span className="hidden w-full font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-60 sm:inline sm:w-auto">
                  {String(tier.features.length).padStart(2, "0")} capabilities
                </span>
              </div>

              {/* Feature grid */}
              <ul className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:gap-x-8">
                {tier.features.map((feature, i) => (
                  <li
                    key={feature.title}
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
                    <p className={`mt-2 pl-8 text-sm leading-relaxed ${tier.descClass}`}>
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
