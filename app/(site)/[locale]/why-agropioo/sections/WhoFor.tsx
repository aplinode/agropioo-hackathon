import { getCurrentDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";

const audienceIcons = [
  <svg key="a1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>,
  <svg key="a2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>,
  <svg key="a3" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>,
];

export default async function WhoFor() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);
  const audiences = ([
    { titleKey: "wy.who.a1Title", descKey: "wy.who.a1Desc", icon: audienceIcons[0] },
    { titleKey: "wy.who.a2Title", descKey: "wy.who.a2Desc", icon: audienceIcons[1] },
    { titleKey: "wy.who.a3Title", descKey: "wy.who.a3Desc", icon: audienceIcons[2] },
  ] as { titleKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0]; icon: React.ReactNode }[]).map(
    (a) => ({ ...a, title: L(a.titleKey), description: L(a.descKey) }),
  );

  return (
    <section
      id="who"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            {L("wy.who.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("wy.who.heading")}
          </h2>
        </div>

        <ul className="mt-14">
          {audiences.map((audience, index) => (
            <li
              key={audience.titleKey}
              className="reveal group grid items-start gap-5 border-t border-agro-sprout py-9 transition-colors duration-300 last:border-b hover:bg-white/70 sm:items-center sm:gap-8 lg:grid-cols-12 lg:py-10"
            >
              <span
                className="hidden font-mono text-sm font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy lg:col-span-1 lg:block"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-5 lg:col-span-5">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                  {audience.icon}
                </span>
                <h3 className="font-display text-xl font-medium tracking-tight text-agro-ink sm:text-[1.45rem]">
                  {audience.title}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-agro-slate sm:max-w-xl sm:text-base lg:col-span-5">
                {audience.description}
              </p>

              <span
                className="hidden h-11 w-11 items-center justify-center rounded-full border border-agro-sprout bg-white text-agro-canopy transition-all duration-300 group-hover:border-agro-canopy group-hover:bg-agro-canopy group-hover:text-white sm:inline-flex lg:col-span-1 lg:justify-self-end"
                aria-hidden="true"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </li>
          ))}
        </ul>

        <p className="reveal mt-10 flex items-center justify-center gap-4 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
          <span className="hidden h-px w-10 bg-agro-sprout sm:inline-block" aria-hidden="true" />
          {L("wy.who.strip")}
          <span className="hidden h-px w-10 bg-agro-sprout sm:inline-block" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
