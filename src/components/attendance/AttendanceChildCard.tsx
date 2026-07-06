"use client";
import { EntityAvatarChip } from "@/components/common/EntityAvatarChip";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

type AttendanceChildCardProps = {
  imageUrl?: string | null;
  name: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  overlay?: ReactNode;
};

/**
 * Selectable avatar tile for the attendance grid. Tapping toggles selection;
 * nothing is written until the caller saves the batch.
 */
export function AttendanceChildCard({
  imageUrl,
  name,
  selected,
  onToggle,
  disabled = false,
  overlay,
}: AttendanceChildCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-pressed={selected}
      aria-label={name}
      disabled={disabled}
      className={`rounded-lg p-2 transition-colors ${
        selected ? "bg-primary-100 ring-2 ring-primary" : "bg-default-100"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <EntityAvatarChip
        imageUrl={imageUrl}
        fallbackIcon={UserIcon}
        avatarClassName="bg-default-200"
        label={name}
        labelClassName="line-clamp-2"
        chipWidth="w-16"
        avatarOverlay={
          selected ? (
            <CheckCircleIcon className="absolute -top-1 -right-1 w-5 h-5 text-primary bg-background rounded-full ring-2 ring-background" />
          ) : overlay ? (
            overlay
          ) : undefined
        }
      />
    </button>
  );
}
