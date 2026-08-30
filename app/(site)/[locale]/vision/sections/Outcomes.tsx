import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

function OutcomeIcon({ variant }: { variant: number }) {
  if (variant === 1) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5" />
      </svg>
    );
  }
  if (variant === 3) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

export default async function Outcomes({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const outcomes = ([
    { titleKey: "vp.outcomes.o1Title", descKey: "vp.outcomes.o1Desc", variant: 1 },
    { titleKey: "vp.outcomes.o2Title", descKey: "vp.outcomes.o2Desc", variant: 2 },
    { titleKey: "vp.outcomes.o3Title", descKey: "vp.outcomes.o3Desc", variant: 3 },
    { titleKey: "vp.outcomes.o4Title", descKey: "vp.outcomes.o4Desc", variant: 4 },
  ] as { titleKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0]; variant: number }[]).map((o) => ({
    title: L(o.titleKey),
    description: L(o.descKey),
    icon: <OutcomeIcon variant={o.variant} />,
  }));

  return (
    <section
      id="outcomes"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("vp.outcomes.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              {L("vp.outcomes.heading")}
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            {L("vp.outcomes.sub")}
          </p>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-agro-sprout bg-agro-sprout shadow-sm sm:grid-cols-2">
          {outcomes.map((outcome, index) => (
            <li
              key={index}
              className="reveal group relative flex items-start gap-5 bg-agro-paper p-7 transition-colors duration-300 hover:bg-white sm:p-9"
            >
              <span
                className="absolute right-6 top-6 font-mono text-xs font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                {outcome.icon}
              </span>
              <div>
                <h3 className="font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
                  {outcome.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                  {outcome.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
