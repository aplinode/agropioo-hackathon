const tiers = [
  {
    name: "Must-Have",
    badge: "Baseline",
    badgeColor: "bg-agro-error/10 text-agro-error",
    features: [
      {
        title: "AI Crop Disease Detection",
        description: "Upload a photo of an affected leaf or plant and get instant disease diagnosis, severity, and treatment recommendations.",
      },
      {
        title: "Satellite Field Monitoring",
        description: "Mark your field boundary and view NDVI-based crop health zones using free Sentinel-2 satellite imagery.",
      },
      {
        title: "Smart Weather Advisory",
        description: "Hyperlocal weather forecasts combined with your crop and growth stage generate daily, actionable farm advice.",
      },
      {
        title: "Mandi Price Tracker & Predictor",
        description: "Track nearby market prices and get AI-powered price trend predictions so you sell at the right time.",
      },
    ],
  },
  {
    name: "Differentiators",
    badge: "Stand out",
    badgeColor: "bg-agro-wheat/20 text-agro-earth",
    features: [
      {
        title: "Regional Language Voice Chatbot",
        description: "Speak or type in Urdu, Punjabi, Saraiki, and more. Get spoken answers in the language you understand best.",
      },
      {
        title: "Government Scheme Matcher",
        description: "Enter your profile and discover every government scheme you qualify for, with documents and apply links.",
      },
      {
        title: "Crop Recommendation Engine",
        description: "AI recommends the most profitable crop for your soil, weather, market demand, and budget this season.",
      },
      {
        title: "Farm Profit/Loss Calculator",
        description: "Track expected and actual costs, yield, revenue, and profit — with break-even and ROI insights.",
      },
      {
        title: "Community Forum + Expert Connect",
        description: "Post questions, share photos, and get answers from fellow farmers and verified agricultural experts.",
      },
    ],
  },
  {
    name: "Wow Factor",
    badge: "Hackathon winners",
    badgeColor: "bg-agro-canopy/10 text-agro-canopy",
    features: [
      {
        title: "Satellite Change Detection",
        description: "Compare satellite images over time with a time-lapse slider to track growth, damage, or encroachment.",
      },
      {
        title: "AI Pest Outbreak Prediction",
        description: "Get early warnings 7 days before likely pest attacks based on weather, crop stage, and historical data.",
      },
      {
        title: "Voice-First Phone Call Mode",
        description: "Dial a toll-free number, speak your question, and hear AI advice in your language — no smartphone needed.",
      },
      {
        title: "Carbon Credit Estimator",
        description: "Log sustainable practices and estimate carbon credits you could earn from voluntary carbon markets.",
      },
      {
        title: "Offline-First PWA + SMS Alerts",
        description: "Works offline in the field, syncs when connected, and sends critical alerts via SMS when data is spotty.",
      },
    ],
  },
];

export default function FeatureMatrix() {
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            Built for every stage of farming
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-agro-slate">
            A complete feature stack designed to protect crops, cut costs, and grow income — from must-have basics to future-ready innovations.
          </p>
        </div>

        <div className="mt-14 space-y-16">
          {tiers.map((tier) => (
            <div key={tier.name}>
              <div className="mb-6 flex items-center gap-3">
                <h3 className="text-2xl font-bold text-agro-ink">{tier.name}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tier.badgeColor}`}>
                  {tier.badge}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tier.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-agro-sprout bg-agro-paper p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-agro-canopy hover:shadow-md"
                  >
                    <h4 className="text-base font-semibold text-agro-ink">
                      {feature.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
