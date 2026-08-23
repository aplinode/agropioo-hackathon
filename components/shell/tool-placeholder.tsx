import Link from "next/link";
import { ArrowRightIcon, SproutIcon } from "@/components/icons";

type ToolPlaceholderProps = {
  /** Mono field label above the title, e.g. "Farms" */
  eyebrow: string;
  /** Page title in display type */
  title: string;
  /** One plain-language line about what this tool will do. */
  description: string;
};

/* Shared stand-in screen for farmer-app routes that exist as navigation
   targets but aren't built yet. Keeps the demo 404-free and honest about
   what is and isn't wired up. */
export default function ToolPlaceholder({
  eyebrow,
  title,
  description,
}: ToolPlaceholderProps) {
  return (
    <div className="pt-1">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
        {eyebrow}
      </p>
      <h1 className="display-heading mt-2 font-display text-3xl font-semibold tracking-tight text-agro-forest sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-agro-slate">{description}</p>

      <section
        aria-labelledby="placeholder-note"
        className="mt-8 rounded-2xl border border-agro-sprout bg-agro-mint p-5"
      >
        <h2
          id="placeholder-note"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          <SproutIcon size={14} className="shrink-0 text-agro-canopy" />
          Demo build
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-agro-slate">
          This screen isn&apos;t part of the demo yet. Your dashboard has
          today&apos;s advisory, alerts, and quick actions meanwhile.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
        >
          Back to dashboard
          <ArrowRightIcon size={16} />
        </Link>
      </section>
    </div>
  );
}
