import type { ReactNode } from "react";

type PageHeaderProps = {
  /** Mono field label above the title, e.g. "Mandi prices" */
  eyebrow: string;
  /** Page title in display type */
  title: string;
  description?: string;
  /** Optional action (link/button) aligned right of the title block */
  action?: ReactNode;
};

/* Shared page header for farmer-app screens: mono field label on a furrow
   hairline, display-serif title, plain-language description. */
export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header>
      <div className="flex items-center gap-3">
        <p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
          {eyebrow}
        </p>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-agro-sprout to-transparent"
        />
        {action}
      </div>
      <h1 className="display-heading mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-agro-forest sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2.5 max-w-lg leading-relaxed text-agro-slate">{description}</p>
      )}
    </header>
  );
}
