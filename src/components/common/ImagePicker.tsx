"use client";
import { CameraIcon } from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type ImagePickerLabels = {
  add: string;
  change: string;
  remove: string;
  label: string;
};

type ImagePickerProps = {
  /** Current preview URL (blob: or remote) or null when no image */
  preview: string | null;
  /** Fallback icon shown when there is no image */
  fallbackIcon: IconComponent;
  /** Extra className for the fallback icon */
  fallbackIconClassName?: string;
  /** Shape of the picker: 'circle' (default) or 'square' */
  shape?: "circle" | "square";
  /** Accessible / display labels */
  labels: ImagePickerLabels;
  /** Open file picker */
  onPick: () => void;
  /** Remove current image */
  onRemove: () => void;
  /** Props to spread on the hidden <input> */
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.RefObject<HTMLInputElement | null>;
  };
};

/**
 * Reusable image/avatar picker.
 * Renders a round button with a camera-badge overlay plus an optional remove link.
 * State is managed by the caller (typically via `useImagePicker`).
 */
export function ImagePicker({
  preview,
  fallbackIcon: FallbackIcon,
  fallbackIconClassName = "w-12 h-12 text-default-300",
  shape = "circle",
  labels,
  onPick,
  onRemove,
  inputProps,
}: ImagePickerProps) {
  const hasImage = preview !== null;
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <button
        type="button"
        aria-label={hasImage ? labels.change : labels.add}
        onClick={onPick}
        className="relative w-24 h-24 active:opacity-70 focus-visible:outline-none"
      >
        <span
          className={`w-full h-full ${shapeClass} overflow-hidden bg-default-100 flex items-center justify-center ring-2 ring-offset-2 ring-default-200 focus-visible:ring-primary`}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={labels.label} className="w-full h-full object-cover" />
          ) : (
            <FallbackIcon className={fallbackIconClassName} />
          )}
        </span>
        {/* Camera overlay badge */}
        <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
          <CameraIcon className="w-3.5 h-3.5 text-white" />
        </span>
      </button>

      {hasImage && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-danger hover:underline"
        >
          {labels.remove}
        </button>
      )}

      {/* Hidden file input — spread inputProps from useImagePicker */}
      <input {...inputProps} />
    </div>
  );
}
