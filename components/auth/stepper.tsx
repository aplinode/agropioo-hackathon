import { CheckIcon } from "@/components/icons";

const steps = ["Email", "Verify code", "New password"] as const;

type StepperProps = {
  current: 1 | 2 | 3;
};

/* Three-step progress indicator for password recovery.
   Completed steps ticked, current highlighted, future muted. */
export default function Stepper({ current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Password recovery progress">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < current;
        const isCurrent = stepNumber === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                isComplete
                  ? "border-agro-canopy bg-agro-canopy text-white"
                  : isCurrent
                    ? "border-agro-canopy bg-agro-mint text-agro-canopy"
                    : "border-agro-clay bg-white text-agro-cloud"
              }`}
              aria-hidden="true"
            >
              {isComplete ? <CheckIcon className="h-3.5 w-3.5" /> : stepNumber}
            </span>
            <span
              className={`truncate text-xs font-medium sm:text-sm ${
                isCurrent ? "text-agro-ink" : "text-agro-slate"
              }`}
              {...(isCurrent ? { "aria-current": "step" as const } : {})}
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <span
                className={`hidden h-px w-6 shrink-0 sm:block ${isComplete ? "bg-agro-canopy" : "bg-agro-clay"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
