"use client";
import { PhotoIcon } from "@heroicons/react/24/outline";
import type { GroupListRow } from "@/queries/groups/get-groups-page";
import { EntityListItemLink } from "@/components/common/EntityListItemLink";

type GroupListItemProps = {
  group: GroupListRow;
};

export function GroupListItem({ group }: GroupListItemProps) {
  return (
    <EntityListItemLink
      href={`/admin/groups/${group.id}`}
      imageUrl={group.image_url}
      fallbackIcon={PhotoIcon}
      fallbackIconClassName="w-6 h-6 text-default-400"
      title={group.name}
      variant="card"
    />
  );
}
