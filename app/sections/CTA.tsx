export default function CTA() {
  return (
    <section className="w-full bg-agro-forest px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to farm smarter?
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-agro-sprout">
          Join the farmers using Agropioo to make better decisions, protect their crops, and grow their income — starting in Pakistan and expanding worldwide.
        </p>

        <form
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="h-12 w-full max-w-sm rounded-lg border border-agro-sprout/30 bg-white/10 px-4 text-sm text-white placeholder:text-agro-sprout/70 focus:border-agro-sprout focus:outline-none focus:ring-2 focus:ring-agro-sprout/30"
          />
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-white px-7 text-sm font-semibold text-agro-forest shadow-sm transition-all hover:-translate-y-0.5 hover:bg-agro-sprout sm:w-auto"
          >
            Get early access
          </button>
        </form>

        <p className="mt-4 text-xs text-agro-sprout/80">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
