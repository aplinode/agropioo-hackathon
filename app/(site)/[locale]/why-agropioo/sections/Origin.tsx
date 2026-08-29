import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

const gapIcons = [
  <svg key="g1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="g2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>,
  <svg key="g3" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.236m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
  </svg>,
];

export default async function Origin({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);
  const gaps = ([
    { titleKey: "wy.origin.g1Title", descKey: "wy.origin.g1Desc", icon: gapIcons[0] },
    { titleKey: "wy.origin.g2Title", descKey: "wy.origin.g2Desc", icon: gapIcons[1] },
    { titleKey: "wy.origin.g3Title", descKey: "wy.origin.g3Desc", icon: gapIcons[2] },
  ] as { titleKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0]; icon: React.ReactNode }[]).map(
    (g) => ({ ...g, title: L(g.titleKey), description: L(g.descKey) }),
  );

  return (
    <section
      id="origin"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-sprout">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("wy.origin.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              {L("wy.origin.heading")}
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-sprout/85">
              {L("wy.origin.sub")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {gaps.map((item, index) => (
              <article
                key={`wy.origin.g${index + 1}Title`}
                className={`reveal group flex flex-col rounded-2xl border border-agro-sprout/15 bg-white/[0.04] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-agro-sprout/40 hover:bg-white/[0.07] ${
                  index === 0 ? "sm:row-span-2 sm:justify-center" : ""
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-agro-sprout/30 bg-white/5 text-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                  {item.icon}
                </span>
                <h3 className="mt-5 font-display text-xl font-medium tracking-tight sm:text-[1.35rem]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/70 sm:text-base">
                  {item.description}
                </p>
              </article>
            ))}

            <p className="reveal flex items-center justify-center gap-3 rounded-2xl bg-agro-canopy px-6 py-5 text-center font-mono text-xs uppercase leading-relaxed tracking-[0.18em] text-white sm:col-span-2">
              <span className="h-px flex-1 bg-white/20" aria-hidden="true" />
              {L("wy.origin.banner")}
              <span className="h-px flex-1 bg-white/20" aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
