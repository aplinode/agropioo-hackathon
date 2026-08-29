import { localized } from "@/lib/i18n/localized";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export default async function AskFlow({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const chips = [
    { label: L("hiw.ask.chipCrop"), value: L("hiw.ask.chipValCrop") },
    { label: L("hiw.ask.chipDistrict"), value: L("hiw.ask.chipValDistrict") },
    { label: L("hiw.ask.chipWeather"), value: L("hiw.ask.chipValWeather") },
    { label: L("hiw.ask.chipHistory"), value: L("hiw.ask.chipValHistory") },
  ];

  return (
    <section
      id="ask"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal flex items-center justify-center gap-3 text-agro-sprout">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              02
            </span>
            {L("hiw.ask.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
            {L("hiw.ask.titleA")}
            <br />
            {L("hiw.ask.titleB")}
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl leading-relaxed text-agro-sprout/85">
            {L("hiw.ask.body")}
          </p>
        </div>

        {/* Question → context → answer pipeline */}
        <div className="reveal mx-auto mt-14 max-w-3xl">
          <div
            role="img"
            aria-label={t("hiw.ask.pipelineLabel").text}
          >
            <div className="flex justify-center">
              <p className="max-w-md rounded-2xl rounded-br-md bg-white/10 px-5 py-3.5 text-sm leading-relaxed text-white ring-1 ring-white/10 sm:text-base">
                &ldquo;{L("hiw.ask.question")}&rdquo;
              </p>
            </div>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 border-t border-dashed border-agro-sprout/30" />
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-agro-sprout/70">
                {L("hiw.ask.checkedAgainst")}
              </span>
              <span className="h-px flex-1 border-t border-dashed border-agro-sprout/30" />
            </div>

            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {chips.map((chip, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-agro-sprout/25 bg-white/5 px-3 py-2.5 text-center"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-agro-sprout/70">
                    {chip.label}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs font-bold text-white">
                    {chip.value}
                  </p>
                </li>
              ))}
            </ul>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-agro-leaf/50 to-transparent" />
              <svg className="h-4 w-4 shrink-0 text-agro-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-agro-leaf/50 to-transparent" />
            </div>

            <div className="flex justify-center">
              <div className="max-w-lg rounded-2xl rounded-bl-md bg-agro-canopy px-6 py-4 shadow-lg">
                <p className="text-sm leading-relaxed text-white sm:text-base">
                  {L("hiw.ask.answer")}
                </p>
                <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-agro-sprout/80">
                  {L("hiw.ask.answerMeta")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-sprout/60">
            {L("hiw.ask.footnote")}
          </p>
        </div>
      </div>
    </section>
  );
}
