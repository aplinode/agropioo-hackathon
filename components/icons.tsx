type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function base({
  size = 20,
  className,
  strokeWidth = 1.75,
}: IconProps): React.SVGAttributes<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
}

export function SproutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21v-7" />
      <path d="M12 14C8.5 14 6 11.5 5.5 7.5c4 .4 6.2 2.6 6.5 6.5Z" />
      <path d="M12 12c.3-3.3 2.5-5.4 6-5-.3 3.5-2.5 5.4-6 5Z" />
    </svg>
  );
}

export function RecordIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M9 8h7" />
      <path d="M9 12h5" />
    </svg>
  );
}

export function LanguagesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5Z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
}

export function WeatherIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7.5" cy="7" r="2.5" />
      <path d="M7.5 1.5V3" />
      <path d="M2 7h1.5" />
      <path d="M3.4 2.9l1 1" />
      <path d="M17.5 21H9a6 6 0 1 1 5.75-7.7h.75a3.85 3.85 0 1 1 0 7.7Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L3 21l1.8-5A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M9.7 8.4A2.4 2.4 0 0 1 12 7c1.3 0 2.4.9 2.4 2.1 0 1.6-2.4 1.7-2.4 3.3" />
      <path d="M12 15.4h.01" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.8 9.2-1.9 4.9-4.9 1.9 1.9-4.9 4.9-1.9Z" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
