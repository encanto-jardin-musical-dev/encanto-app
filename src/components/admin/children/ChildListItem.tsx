"use client";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { UsersIcon } from "@heroicons/react/24/solid";
import type { ChildListRow } from "@/queries/children/get-children-page";
import { EntityListItemLink } from "@/components/common/EntityListItemLink";

type ChildListItemProps = {
  child: ChildListRow;
};

export function ChildListItem({ child }: ChildListItemProps) {
  const subtitle = child.parentName ? (
    <>
      <UsersIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{child.parentName}</span>
    </>
  ) : undefined;

  return (
    <EntityListItemLink
      href={`/admin/children/${child.id}`}
      imageUrl={child.avatar_url}
      imageAlt={`${child.first_name} ${child.last_name}`}
      fallbackIcon={UserCircleIcon}
      title={`${child.first_name} ${child.last_name}`}
      subtitle={subtitle}
      variant="card"
    />
  );
}
