"use client";
import Link from "next/link";
import type { ComponentType, SVGProps, ReactNode } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

/**
 * Row visual style.
 * - `divider`: flush row separated by a bottom divider (used by the messages contacts list).
 * - `card`: each row wrapped in a `bg-default-100 rounded-lg p-2` card with no divider (used by the admin lists).
 */
type EntityListItemVariant = "divider" | "card";

type EntityListItemLinkProps = {
  href: string;
  imageUrl?: string | null;
  /** Alt text for the image */
  imageAlt?: string;
  /** Fallback icon when there is no image */
  fallbackIcon: IconComponent;
  fallbackIconClassName?: string;
  /** Primary label (name) */
  title: string;
  /** Optional secondary line (e.g. parent name) */
  subtitle?: ReactNode;
  /** Row visual style. Defaults to `divider`. */
  variant?: EntityListItemVariant;
};

const VARIANT_CLASSNAMES: Record<EntityListItemVariant, string> = {
  divider: "py-3 px-1 border-b border-default-200 last:border-0",
  card: "bg-default-100 rounded-lg p-2",
};

/**
 * A list-row link with a round avatar, a title, and an optional subtitle.
 * Used by ChildListItem, GroupListItem, and the messages contacts list.
 */
export function EntityListItemLink({
  href,
  imageUrl,
  imageAlt,
  fallbackIcon: FallbackIcon,
  fallbackIconClassName = "w-7 h-7 text-default-400",
  title,
  subtitle,
  variant = "divider",
}: EntityListItemLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 active:opacity-70 ${VARIANT_CLASSNAMES[variant]}`}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-default-100 flex items-center justify-center shrink-0">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={imageAlt ?? title} className="w-full h-full object-cover" />
        ) : (
          <FallbackIcon className={fallbackIconClassName} />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-foreground truncate">{title}</span>
        {subtitle && (
          <span className="flex items-center gap-1 text-small text-default-500 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}
