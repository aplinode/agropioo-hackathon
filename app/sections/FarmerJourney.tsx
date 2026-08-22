const steps = [
  {
    title: "Add Farm",
    description: "Enter your location, crop, and basic farm details to create your digital farm profile.",
  },
  {
    title: "Ask the AI",
    description: "Type or speak your farming question in a language you are comfortable with.",
  },
  {
    title: "Get Guidance",
    description: "Receive personalised advice based on your crop, weather, location, and farm history.",
  },
  {
    title: "Record Activity",
    description: "Log irrigation, fertiliser, pesticide, disease, or any other farm activity with a few taps.",
  },
  {
    title: "Build History",
    description: "Agropioo stores every record so future recommendations keep getting smarter and more relevant.",
  },
  {
    title: "Continue Monitoring",
    description: "Review records, track progress, and receive ongoing guidance throughout the season.",
  },
];

export default function FarmerJourney() {
  return (
    <section className="w-full bg-agro-stone px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            How Agropioo works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-agro-slate">
            A simple journey from your first question to a complete, intelligent farm history.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-agro-clay bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-agro-canopy text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-agro-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
