import { LanguagesIcon, RecordIcon, SproutIcon, WeatherIcon } from "./icons";

const recordChips = [
  "Irrigation",
  "Fertiliser",
  "Pesticide",
  "Planting",
  "Disease",
  "Expenses",
  "Harvest",
];

const languageChips = ["Urdu", "Punjabi", "Saraiki", "Pashto", "Balochi", "Hindko"];

function CardShell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border border-agro-sprout/60 p-7 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-agro-canopy text-white">
      {children}
    </span>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-agro-canopy">
            What Agropioo does
          </p>
          <h2 className="display-heading mt-3 font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.12] text-agro-forest">
            An advisor that knows your farm.
          </h2>
          <p className="mt-4 leading-relaxed text-agro-slate">
            Four capabilities work together — advice that fits your crop, and a
            record that remembers every season before it.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <CardShell className="bg-agro-mint lg:col-span-7">
            <IconChip>
              <SproutIcon size={22} />
            </IconChip>
            <h3 className="mt-5 text-lg font-semibold text-agro-forest">
              AI Agriculture Advisor
            </h3>
            <p className="mt-2 max-w-md leading-relaxed text-agro-slate">
              Practical recommendations for irrigation timing, fertiliser and
              pesticide guidance, pest and disease support, planting and
              harvest — personalised to your crop and conditions.
            </p>
            <div className="mt-6 space-y-3">
              <figure className="max-w-sm rounded-2xl rounded-bl-md border border-agro-sprout/70 bg-white px-4 py-3">
                <blockquote className="text-sm text-agro-ink">
                  &ldquo;When should I irrigate my wheat?&rdquo;
                </blockquote>
              </figure>
              <figure className="ml-auto max-w-sm rounded-2xl rounded-br-md bg-agro-canopy px-4 py-3 text-white">
                <blockquote className="text-sm leading-relaxed">
                  Irrigate in the cool hours before sunrise.
                </blockquote>
                <figcaption className="mt-1.5 flex items-center gap-1.5 text-xs text-agro-sprout">
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-agro-sprout" />
                  Today&rsquo;s advisory for your wheat
                </figcaption>
              </figure>
            </div>
          </CardShell>

          <CardShell className="bg-agro-stone lg:col-span-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-agro-earth/15 text-agro-earth">
              <RecordIcon size={22} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-agro-forest">
              Digital Farm Record
            </h3>
            <p className="mt-2 leading-relaxed text-agro-slate">
              A structured history for every field — what was done, when, and
              how it went. Your farm history, always within reach.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="What you can record">
              {recordChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-agro-clay bg-white px-3 py-1.5 text-xs font-medium text-agro-slate"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </CardShell>

          <CardShell className="bg-white lg:col-span-5">
            <IconChip>
              <LanguagesIcon size={22} />
            </IconChip>
            <h3 className="mt-5 text-lg font-semibold text-agro-forest">
              Guidance in your language
            </h3>
            <p className="mt-2 leading-relaxed text-agro-slate">
              Ask questions and read advice in the language you think in — no
              English required.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Supported languages">
              {languageChips.map((lang) => (
                <li
                  key={lang}
                  className="rounded-full border border-agro-sprout bg-agro-mint px-3 py-1.5 text-xs font-medium text-agro-forest"
                >
                  {lang}
                </li>
              ))}
            </ul>
          </CardShell>

          <CardShell className="bg-white lg:col-span-7">
            <IconChip>
              <WeatherIcon size={22} />
            </IconChip>
            <h3 className="mt-5 text-lg font-semibold text-agro-forest">
              Weather-Aware Guidance
            </h3>
            <p className="mt-2 max-w-md leading-relaxed text-agro-slate">
              Forecasts translated into decisions for your crop&rsquo;s current
              stage — not generic weather reports.
            </p>
            <p className="mt-6 flex items-start gap-3 rounded-xl border border-agro-sprout/70 bg-agro-mint px-4 py-3.5 font-mono text-[13px] leading-relaxed text-agro-forest">
              <WeatherIcon size={18} className="mt-0.5 shrink-0 text-agro-canopy" />
              Heavy rain expected this evening — delay irrigation until tomorrow
              morning.
            </p>
          </CardShell>
        </div>
      </div>
    </section>
  );
}
