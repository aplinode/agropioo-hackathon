import { localized } from "@/lib/i18n/localized";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

const checkIcons = [
  "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
] as const;

export default async function GuidanceEngine({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const checks = [
    { title: L("hiw.engine.check1Title"), description: L("hiw.engine.check1Desc"), icon: checkIcons[0] },
    { title: L("hiw.engine.check2Title"), description: L("hiw.engine.check2Desc"), icon: checkIcons[1] },
    { title: L("hiw.engine.check3Title"), description: L("hiw.engine.check3Desc"), icon: checkIcons[2] },
    { title: L("hiw.engine.check4Title"), description: L("hiw.engine.check4Desc"), icon: checkIcons[3] },
  ];

  return (
    <section
      id="engine"
      className="w-full bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal flex items-center justify-center gap-3 text-agro-canopy">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              03
            </span>
            {L("hiw.engine.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("hiw.engine.title")}
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            {L("hiw.engine.body")}
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {checks.map((check, index) => (
            <li
              key={index}
              className={`reveal relative flex flex-col px-0 lg:px-7 ${
                index > 0 ? "lg:border-l lg:border-agro-clay/70" : ""
              } ${index === 0 ? "lg:pl-0" : ""} ${index === checks.length - 1 ? "lg:pr-0" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 hover:bg-agro-canopy hover:text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={check.icon} />
                  </svg>
                </span>
                <span
                  className="font-mono text-xs font-semibold tracking-widest text-agro-canopy/50"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
                {check.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-agro-slate">
                {check.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="reveal mx-auto mt-14 flex max-w-md flex-col items-stretch gap-3 rounded-2xl border border-agro-clay/70 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agro-error/10 text-agro-error" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
          </span>
          <p className="text-sm leading-relaxed text-agro-slate">
            <strong className="font-semibold text-agro-ink">
              {L("hiw.engine.safetyStrong")}
            </strong>{" "}
            {L("hiw.engine.safetyRest")}
          </p>
        </div>
      </div>
    </section>
  );
}
