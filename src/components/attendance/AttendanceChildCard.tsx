"use client";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";

type AttendanceChildCardProps = {
  imageUrl?: string | null;
  name: string;
  selected: boolean;
  onToggle: () => void;
};

/**
 * Selectable avatar tile for the attendance grid. Tapping toggles selection;
 * nothing is written until the caller saves the batch.
 */
export function AttendanceChildCard({ imageUrl, name, selected, onToggle }: AttendanceChildCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={name}
      className={`flex flex-col items-center gap-1 w-20 rounded-lg p-2 transition-colors ${
        selected ? "bg-primary-100 ring-2 ring-primary" : "bg-default-100"
      }`}
    >
      <div className="relative w-16 h-16 shrink-0">
        <div className="w-16 h-16 rounded-full bg-default-200 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-8 h-8 text-default-400" />
          )}
        </div>
        {selected && (
          <CheckCircleIcon className="absolute -top-1 -right-1 w-5 h-5 text-primary bg-background rounded-full ring-2 ring-background" />
        )}
      </div>
      <span className="text-xs text-center text-default-600 leading-tight line-clamp-2">{name}</span>
    </button>
  );
}
