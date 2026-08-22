const languages = [
  { native: "اردو", latin: "Urdu" },
  { native: "پنجابی", latin: "Punjabi" },
  { native: "سرائیکی", latin: "Saraiki" },
  { native: "پښتو", latin: "Pashto" },
  { native: "بلوچی", latin: "Balochi" },
  { native: "ہندکو", latin: "Hindko" },
];

export function PakistanFirst() {
  return (
    <section
      id="pakistan-first"
      className="scroll-mt-16 bg-agro-stone"
      aria-labelledby="pakistan-heading"
    >
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-agro-canopy">
          Pakistan first
        </p>
        <h2
          id="pakistan-heading"
          className="display-heading mt-4 font-display text-[clamp(2.1rem,5vw,3.25rem)] font-semibold leading-[1.1] text-agro-forest"
        >
          Built for Pakistan.
          <br />
          Ready for the world.
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-agro-slate">
          Agropioo starts with Pakistan&rsquo;s crops, climates, and farming
          practices — refined through real farmer feedback — before growing into
          new countries, languages, and conditions.
        </p>

        <ul
          className="mt-10 flex flex-wrap justify-center gap-2.5"
          aria-label="Languages supported at launch"
        >
          {languages.map((lang) => (
            <li
              key={lang.latin}
              className="rounded-full border border-agro-clay bg-white px-4 py-2 text-sm text-agro-forest shadow-sm"
            >
              <span lang="ur" className="font-medium">
                {lang.native}
              </span>{" "}
              <span className="text-agro-slate">{lang.latin}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
