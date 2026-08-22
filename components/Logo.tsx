import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Agropioo logo"
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
      />
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight text-agro-forest">
          Agropioo
        </span>
      )}
    </span>
  );
}
