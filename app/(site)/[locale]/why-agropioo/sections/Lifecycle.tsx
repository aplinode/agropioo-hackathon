import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

export default async function Lifecycle({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);
  const advisorScope = ([
    { titleKey: "wy.life.s1Title", descKey: "wy.life.s1Desc" },
    { titleKey: "wy.life.s2Title", descKey: "wy.life.s2Desc" },
    { titleKey: "wy.life.s3Title", descKey: "wy.life.s3Desc" },
    { titleKey: "wy.life.s4Title", descKey: "wy.life.s4Desc" },
    { titleKey: "wy.life.s5Title", descKey: "wy.life.s5Desc" },
    { titleKey: "wy.life.s6Title", descKey: "wy.life.s6Desc" },
    { titleKey: "wy.life.s7Title", descKey: "wy.life.s7Desc" },
  ] as { titleKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0] }[]).map(
    (s) => ({ ...s, title: L(s.titleKey), description: L(s.descKey) }),
  );

  return (
    <section
      id="guidance"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("wy.life.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              {L("wy.life.heading")}
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
              {L("wy.life.sub")}
            </p>
          </div>

          <ul className="lg:col-span-7">
            {advisorScope.map((item, index) => (
              <li
                key={item.titleKey}
                className="reveal group flex items-start gap-5 border-b border-agro-sprout/80 py-6 transition-colors duration-300 last:border-b-0 sm:gap-7"
              >
                <span
                  className="mt-1 font-mono text-xs font-semibold tracking-widest text-agro-canopy/50 transition-colors duration-300 group-hover:text-agro-canopy"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink transition-colors duration-300 group-hover:text-agro-canopy sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 leading-relaxed text-agro-slate">
                    {item.description}
                  </p>
                </div>
                <span className="mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-agro-canopy ring-1 ring-agro-sprout transition-all duration-300 group-hover:bg-agro-canopy group-hover:text-white" aria-hidden="true">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
