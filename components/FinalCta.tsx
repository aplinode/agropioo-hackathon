import { EarlyAccessForm } from "./EarlyAccessForm";
import { FurrowMotif } from "./FurrowMotif";

export function FinalCta() {
  return (
    <section id="early-access" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-agro-forest px-6 py-14 text-center sm:p-16">
          <FurrowMotif
            tone="ghost"
            className="pointer-events-none absolute -bottom-6 left-1/2 w-[140%] max-w-none -translate-x-1/2 text-white sm:w-full"
          />
          <div className="relative">
            <h2 className="display-heading mx-auto max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.1] text-white">
              Be first in the field.
            </h2>
            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-agro-sprout">
              Early access opens soon for farmers across Pakistan. Leave your
              email and we&rsquo;ll let you know when Agropioo is ready.
            </p>
            <div className="mt-8">
              <EarlyAccessForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
