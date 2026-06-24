import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type EntityAvatarChipProps = {
  imageUrl?: string | null;
  /** Fallback icon shown when there is no image */
  fallbackIcon: IconComponent;
  fallbackIconClassName?: string;
  /** Shape of the avatar */
  shape?: "circle" | "square";
  /** Width/height class for the avatar container (e.g. "w-16 h-16") */
  size?: string;
  /** Display name shown below the avatar */
  label: string;
  /** Width class for the outer chip wrapper (e.g. "w-20") */
  chipWidth?: string;
};

/**
 * A small avatar-circle (or square) with a centered label underneath.
 * Used in detail-screen grids for teachers, children, guardians, and groups.
 */
export function EntityAvatarChip({
  imageUrl,
  fallbackIcon: FallbackIcon,
  fallbackIconClassName = "w-8 h-8 text-default-400",
  shape = "circle",
  size = "w-16 h-16",
  label,
  chipWidth = "w-20",
}: EntityAvatarChipProps) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className={`flex flex-col items-center gap-1 ${chipWidth}`}>
      <div
        className={`${size} ${shapeClass} bg-default-100 flex items-center justify-center overflow-hidden`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <FallbackIcon className={fallbackIconClassName} />
        )}
      </div>
      <span className="text-xs text-center text-default-600 leading-tight">{label}</span>
    </div>
  );
}
