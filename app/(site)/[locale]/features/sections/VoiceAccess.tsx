import { getCurrentDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";

const languages = ["اردو", "پنجابی", "سرائیکی", "پشتو", "بلوچی", "ہندکو"];

export default async function VoiceAccess() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  return (
    <section
      id="access"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-sprout">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("feat.voice.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              {L("feat.voice.headingA")}
              <br />
              {L("feat.voice.headingB")}
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-sprout/85">
              {L("feat.voice.sub")}
            </p>

            <div className="reveal mt-8 flex flex-wrap gap-2" dir="rtl" lang="ur">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-agro-sprout/40 bg-white/5 px-3.5 py-1.5 text-base leading-none text-agro-sprout"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {/* Voice chatbot */}
            <article
              className="reveal flex flex-col rounded-2xl border border-agro-sprout/20 bg-white/[0.05] p-6 transition-colors duration-300 hover:border-agro-sprout/45"
              role="img"
              aria-label={t("feat.voice.speakMock").text}
            >
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-sprout">
                {L("feat.voice.speakCode")}
              </p>
              <h3 className="mt-3.5 text-lg font-semibold tracking-tight">
                {L("feat.voice.speakTitle")}
              </h3>
              <div className="mt-4 flex-1 space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-agro-canopy px-4 py-2.5 text-sm leading-relaxed text-white">
                  {L("feat.voice.chatUser")}
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-agro-sprout/30 bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-white/90">
                  {L("feat.voice.chatAdvisor")}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-full border border-agro-sprout/25 bg-white/5 py-1.5 pl-4 pr-1.5">
                <span className="text-xs text-agro-sprout/70">{L("feat.voice.inputPlaceholder")}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </span>
              </div>
            </article>

            {/* Phone call mode */}
            <article
              className="reveal flex flex-col rounded-2xl border border-agro-sprout/20 bg-white/[0.05] p-6 transition-colors duration-300 hover:border-agro-sprout/45"
              role="img"
              aria-label={t("feat.voice.callMock").text}
            >
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-sprout">
                {L("feat.voice.callCode")}
              </p>
              <h3 className="mt-3.5 text-lg font-semibold tracking-tight">
                {L("feat.voice.callTitle")}
              </h3>
              <ul className="mt-4 flex-1 space-y-2.5 font-mono text-xs leading-relaxed">
                <li className="rounded-lg bg-white/5 px-3 py-2 text-agro-sprout/80">
                  <span className="block text-[0.6rem] uppercase tracking-widest text-agro-sprout/50">00:02</span>
                  {L("feat.voice.greetingLine")}
                </li>
                <li className="rounded-lg bg-white/5 px-3 py-2 text-agro-sprout/80">
                  <span className="block text-[0.6rem] uppercase tracking-widest text-agro-sprout/50">00:09</span>
                  {L("feat.voice.heardLine")}
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-agro-canopy/60 px-3 py-2 text-white">
                  <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
                  </svg>
                  {L("feat.voice.callEnded")}
                </li>
              </ul>
              <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-widest text-agro-sprout/50">
                {L("feat.voice.anyPhone")}
              </p>
            </article>

            {/* Offline + SMS */}
            <article className="reveal rounded-2xl border border-agro-sprout/20 bg-white/[0.05] p-6 transition-colors duration-300 hover:border-agro-sprout/45 sm:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-md">
                  <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-sprout">
                    {L("feat.voice.offlineCode")}
                  </p>
                  <h3 className="mt-3.5 text-lg font-semibold tracking-tight">
                    {L("feat.voice.offlineTitle")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-agro-sprout/75">
                    {L("feat.voice.offlineDesc")}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-stretch justify-center gap-3 min-w-56 max-w-sm">
                  <div className="flex items-center justify-between rounded-xl border border-agro-sprout/25 bg-white/5 px-4 py-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-agro-sprout/70">
                      {L("feat.voice.networkStatus")}
                    </span>
                    <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-agro-warning">
                      <span className="h-2 w-2 rounded-full bg-agro-warning" aria-hidden="true" />
                      {L("feat.voice.offlineQueued")}
                    </span>
                  </div>
                  <div className="rounded-xl bg-agro-canopy px-4 py-3 shadow-sm">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-agro-sprout/80">
                      {L("feat.voice.smsStamp")}
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {L("feat.voice.smsMsg")}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
