import { localized } from "@/lib/i18n/localized";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export default async function Problem({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const problems = [
    {
      title: L("home.problem.item1Title"),
      description: L("home.problem.item1Body"),
    },
    {
      title: L("home.problem.item2Title"),
      description: L("home.problem.item2Body"),
    },
    {
      title: L("home.problem.item3Title"),
      description: L("home.problem.item3Body"),
    },
  ];

  return (
    <section
      id="why"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-sprout">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("home.problem.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              {L("home.problem.title")}
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-sprout/85">
              {L("home.problem.subtitle")}
            </p>
          </div>

          <div className="lg:col-span-7">
            <ul>
              {problems.map((item, index) => (
                <li
                  key={index}
                  className="reveal group border-t border-agro-sprout/15 py-7 transition-colors duration-300 first:border-t-0 first:pt-0 hover:bg-white/[0.04] sm:first:pt-7 lg:first:border-t lg:first:pt-7"
                >
                  <div className="flex gap-6 px-2 sm:gap-8 sm:px-4">
                    <span
                      className="font-mono text-sm font-semibold tracking-widest text-agro-sprout/60 transition-colors duration-300 group-hover:text-white"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-lg leading-relaxed text-agro-sprout/75">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="reveal mt-8 flex items-center gap-3 px-2 sm:px-4">
              <span className="hidden h-px flex-1 bg-agro-sprout/15 sm:block" aria-hidden="true" />
              <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.18em] text-agro-sprout/60">
                {L("home.problem.kicker")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
