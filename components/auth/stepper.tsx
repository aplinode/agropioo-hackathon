import { CheckIcon } from "@/components/icons";

const steps = ["Email", "Verify code", "New password"] as const;

type StepperProps = {
  current: 1 | 2 | 3;
};

/* Three-step progress indicator for password recovery, drawn as a furrow
   line: completed steps ticked, current step highlighted, future muted. */
export default function Stepper({ current }: StepperProps) {
  return (
    <ol
      className="flex items-start"
      aria-label="Password recovery progress"
    >
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < current;
        const isCurrent = stepNumber === current;
        return (
          <li
            key={label}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            {/* Furrow segment running to the next step */}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-[15px] start-[calc(50%+22px)] w-[calc(100%-44px)] border-t border-dashed ${
                  isComplete ? "border-agro-canopy" : "border-agro-clay"
                }`}
              />
            )}
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                isComplete
                  ? "border-agro-canopy bg-agro-canopy text-white"
                  : isCurrent
                    ? "border-agro-canopy bg-agro-mint text-agro-canopy"
                    : "border-agro-clay bg-white text-agro-cloud"
              }`}
              aria-hidden="true"
            >
              {isComplete ? <CheckIcon size={14} /> : stepNumber}
            </span>
            <span
              className={`max-w-full truncate text-xs font-medium sm:text-sm ${
                isCurrent ? "font-semibold text-agro-forest" : "text-agro-slate"
              }`}
              {...(isCurrent ? { "aria-current": "step" as const } : {})}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
