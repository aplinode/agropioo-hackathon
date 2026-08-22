type FurrowMotifProps = {
  tone?: "field" | "ghost";
  className?: string;
};

export function FurrowMotif({ tone = "field", className }: FurrowMotifProps) {
  const ghost = tone === "ghost";

  return (
    <svg
      viewBox="0 0 720 400"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {ghost ? (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path
            d="M0 214C120 186 220 240 350 222S600 176 720 206"
            opacity="0.35"
          />
          <path
            d="M0 246C100 226 200 270 320 256S560 212 720 240"
            opacity="0.45"
          />
          <path
            d="M0 262C90 236 170 288 288 272S520 224 720 258V400H0Z"
            fill="currentColor"
            stroke="none"
            opacity="0.08"
          />
          <path
            d="M0 292C110 270 220 314 340 298S570 254 720 284"
            opacity="0.55"
          />
          <path
            d="M0 306C110 280 210 330 330 314S560 268 720 300V400H0Z"
            fill="currentColor"
            stroke="none"
            opacity="0.12"
          />
          <path
            d="M0 332C120 310 230 350 350 338S580 300 720 324"
            opacity="0.65"
          />
          <path
            d="M0 352C130 328 240 372 360 358S580 318 720 344V400H0Z"
            fill="currentColor"
            stroke="none"
            opacity="0.16"
          />
          <path
            d="M0 374C140 354 260 386 380 376S600 344 720 362"
            opacity="0.75"
          />
        </g>
      ) : (
        <>
          <path
            d="M0 262C90 236 170 288 288 272S520 224 720 258V400H0Z"
            fill="var(--color-agro-sprout)"
            opacity="0.5"
          />
          <path
            d="M0 306C110 280 210 330 330 314S560 268 720 300V400H0Z"
            fill="var(--color-agro-leaf)"
            opacity="0.16"
          />
          <path
            d="M0 352C130 328 240 372 360 358S580 318 720 344V400H0Z"
            fill="var(--color-agro-canopy)"
            opacity="0.9"
          />
          <g strokeWidth="2" strokeLinecap="round">
            <path
              d="M0 214C120 186 220 240 350 222S600 176 720 206"
              stroke="var(--color-agro-leaf)"
              opacity="0.55"
            />
            <path
              d="M0 246C100 226 200 270 320 256S560 212 720 240"
              stroke="var(--color-agro-canopy)"
              opacity="0.4"
            />
            <path
              d="M0 292C110 270 220 314 340 298S570 254 720 284"
              stroke="var(--color-agro-canopy)"
              opacity="0.35"
            />
            <path
              d="M0 332C120 310 230 350 350 338S580 300 720 324"
              stroke="var(--color-agro-paper)"
              opacity="0.7"
            />
            <path
              d="M0 374C140 354 260 386 380 376S600 344 720 362"
              stroke="var(--color-agro-paper)"
              opacity="0.5"
            />
          </g>
        </>
      )}
    </svg>
  );
}
