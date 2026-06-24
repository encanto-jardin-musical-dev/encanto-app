import type { ReactNode } from "react";

type EntityChipSectionProps<T> = {
  /** Section heading text */
  title: string;
  /** Heading level: 'h2' (default) or 'h3' */
  headingLevel?: "h2" | "h3";
  /** Label shown when `items` is empty */
  emptyLabel: string;
  items: T[];
  /** Render a chip for one item */
  renderChip: (item: T) => ReactNode;
};

/**
 * A titled, flex-wrap grid of entity chips with an empty-state fallback.
 * Wraps `EntityAvatarChip` instances for teachers, children, guardians, and groups.
 */
export function EntityChipSection<T>({
  title,
  headingLevel: Heading = "h2",
  emptyLabel,
  items,
  renderChip,
}: EntityChipSectionProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <Heading className="font-semibold text-foreground">{title}</Heading>
      {items.length === 0 ? (
        <p className="text-small text-default-500">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.map((item, i) => (
            <div key={i}>{renderChip(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
