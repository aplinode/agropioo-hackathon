import { StarIcon } from "@/components/icons";

export default function FavoriteCropStar({
  cropId,
  isFavorite,
  onToggle,
  ariaLabel,
}: {
  cropId: string;
  isFavorite: boolean;
  onToggle: (cropId: string) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(cropId)}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-agro-canopy focus:ring-offset-2"
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
    >
      <StarIcon
        size={22}
        className={
          isFavorite
            ? "fill-agro-wheat text-agro-wheat"
            : "text-agro-cloud"
        }
      />
    </button>
  );
}
