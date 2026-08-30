import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

const pillarIcons = [
  <svg key="p1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
  </svg>,
  <svg key="p2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="p3" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>,
];

export default async function ValueProp({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);
  const pillars = ([
    { headingKey: "wy.value.p1Heading", descKey: "wy.value.p1Desc", icon: pillarIcons[0] },
    { headingKey: "wy.value.p2Heading", descKey: "wy.value.p2Desc", icon: pillarIcons[1] },
    { headingKey: "wy.value.p3Heading", descKey: "wy.value.p3Desc", icon: pillarIcons[2] },
  ] as { headingKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0]; icon: React.ReactNode }[]).map(
    (p) => ({ ...p, heading: L(p.headingKey), description: L(p.descKey) }),
  );

  return (
    <section
      id="promise"
      className="w-full bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow reveal flex items-center justify-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            {L("wy.value.eyebrow")}
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("wy.value.heading1")}
            <br />
            {L("wy.value.heading2")}
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl leading-relaxed text-agro-slate">
            {L("wy.value.sub")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.headingKey}
              className="reveal group rounded-2xl border border-agro-sprout/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                  {pillar.icon}
                </span>
                <span
                  className="font-mono text-sm font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
                {pillar.heading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-agro-slate sm:text-base">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
