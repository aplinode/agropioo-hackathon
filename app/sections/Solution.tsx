const values = [
  {
    title: "What to do",
    description:
      "Get clear, personalised recommendations for irrigation, fertiliser, pest control, and harvest timing based on your crop and conditions.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
      </svg>
    ),
  },
  {
    title: "When to do it",
    description:
      "Weather-aware guidance tells you the right moment to act, so you avoid losses from bad timing and unexpected conditions.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "What has been done",
    description:
      "Keep a complete digital history of every farm activity — irrigation, inputs, disease, expenses, and harvest — always within reach.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

export default function Solution() {
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            Your farm&apos;s intelligence, in one place
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-agro-slate">
            Agropioo combines personalised AI guidance with structured digital farm records so you always know the next right step.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {values.map((item, index) => (
            <div key={item.title} className="relative text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-agro-canopy text-white shadow-md">
                {item.icon}
              </div>
              <div className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-agro-mint text-sm font-bold text-agro-canopy">
                {index + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-agro-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
