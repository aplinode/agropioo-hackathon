type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  "data-flip-rtl"?: boolean;
};

function base({
  size = 20,
  className,
  strokeWidth = 1.75,
  "data-flip-rtl": dataFlipRtl,
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
    ...(dataFlipRtl !== undefined ? { "data-flip-rtl": dataFlipRtl } : {}),
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
    <svg {...base(props)} data-flip-rtl="">
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

export function WarningIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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

/* ---- Farmer app icon set (dashboard shell, auth screens) ---- */

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 19C5 11 10 5.5 20 4.5c-.8 9-6 14.5-15 14.5Z" />
      <path d="M5 19c2.5-5 6.5-8.5 11-10.5" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.25 11.25c0 4.556-3.694 8.25-8.25 8.25a9.06 9.06 0 01-2.16-.267c-.803.506-1.767.83-2.79.948a.75.75 0 01-.848-1.015 4.5 4.5 0 00-.63-1.65A8.228 8.228 0 013.75 11.25c0-4.556 3.694-8.25 8.25-8.25s8.25 3.694 8.25 8.25Z" />
      <path d="M8.25 11.25h.008v.008H8.25v-.008Zm3.75 0h.008v.008H12v-.008Zm3.75 0h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
      <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6ZM13.5 15.75A2.25 2.25 0 0115.75 13.5H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25ZM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25Z" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3Z" />
      <path d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18Zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18" />
    </svg>
  );
}

export function CloudRainIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.75 15.75a4.5 4.5 0 01.34-8.987 6 6 0 0111.32 2.987 3.75 3.75 0 01-.41 7.5H6.75Z" />
      <path d="M9 18.75l-.75 2.25m4.5-2.25l-.75 2.25m4.5-2.25l-.75 2.25" />
    </svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 15a4.5 4.5 0 01.3-8.99 6 6 0 0111.32 2.99 3.75 3.75 0 01-.41 7.5H6Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0Z" />
    </svg>
  );
}

export function BugIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 12.75v4.5m0-4.5v-1.5M12 7.5c2.485 0 4.5 2.015 4.5 4.5v2.25a4.5 4.5 0 11-9 0V12c0-2.485 2.015-4.5 4.5-4.5Zm0 0c-.69 0-1.25-.836-1.25-1.875S11.31 3.75 12 3.75s1.25.836 1.25 1.875S12.69 7.5 12 7.5Zm-4.5 4.5H4.875m14.25 0H21.5m-17 4.5h1.875m12.75 0H21.5M7.5 9.75 6 8.25m10.5 1.5L18 8.25" />
    </svg>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...base(props)} data-flip-rtl="">
      <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)} data-flip-rtl="">
      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MoreVerticalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

/* ---- Farmer tool icons (prices, records, advisor) ---- */

export function DropletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.25s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />
    </svg>
  );
}

export function TrendingDownIcon(props: IconProps) {
  return (
    <svg {...base(props)} data-flip-rtl="">
      <path d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 0 1 5.814 5.519l2.74 1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 3h5" />
      <path d="M10 3v6.2L5.8 17a3 3 0 0 0 2.7 4.3h7a3 3 0 0 0 2.7-4.3L14 9.2V3" />
      <path d="M7.6 14.5h8.8" />
    </svg>
  );
}

export function WindIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.59 13.5a2.25 2.25 0 01.9 4.35 2.25 2.25 0 01-2.25-2.25c0-1.05.66-1.85 1.35-2.1M15 6.75a2.25 2.25 0 012.25-2.25c1.05 0 1.85.66 2.1 1.35M12 18.75a2.25 2.25 0 01-2.25-2.25c0-1.05.66-1.85 1.35-2.1M17.25 13.5a2.25 2.25 0 01-2.25 2.25c-1.05 0-1.85-.66-2.1-1.35M6.75 12a2.25 2.25 0 012.25 2.25c.63 0 1.35-.21 1.35-1.35" />
    </svg>
  );
}

export function WheatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21v-8" />
      <path d="M12 13c-2.4 0-4.2-1.7-4.6-4.3C9.9 9 11.6 10.5 12 13Z" />
      <path d="M12 13c2.4 0 4.2-1.7 4.6-4.3C14.1 9 12.4 10.5 12 13Z" />
      <path d="M12 9c-2.4 0-4.2-1.7-4.6-4.3C9.9 5 11.6 6.5 12 9Z" />
      <path d="M12 9c2.4 0 4.2-1.7 4.6-4.3C14.1 5 12.4 6.5 12 9Z" />
      <path d="M12 21c-2 0-3.6-1.3-4-3.4 2 .2 3.4 1.4 4 3.4Z" />
      <path d="M12 21c2 0 3.6-1.3 4-3.4-2 .2-3.4 1.4-4 3.4Z" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 13.5 19 5l-3.9 12.9-3.6-5.4-6.9-.8" />
      <path d="m3 20 9-5" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
    </svg>
  );
}

export function RestoreIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function RefreshCwIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M21 3v5h-5M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M19 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16M21 19v-5h-5" />
    </svg>
  );
}

export function SatelliteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2l2.5 5 5 .5-3.5 3.5.5 5-4.5-2.5L7.5 16l.5-5-3.5-3.5 5-.5z" />
    </svg>
  );
}
