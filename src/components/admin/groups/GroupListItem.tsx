"use client";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { GroupListRow } from "@/queries/groups/get-groups-page";

type GroupListItemProps = {
  group: GroupListRow;
};

export function GroupListItem({ group }: GroupListItemProps) {
  return (
    <Link
      href={`/admin/groups/${group.id}`}
      className="flex items-center gap-3 py-3 px-1 border-b border-divider last:border-0 active:opacity-70"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-default-100 flex items-center justify-center shrink-0">
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <PhotoIcon className="w-6 h-6 text-default-400" />
        )}
      </div>
      <span className="font-medium text-foreground truncate">{group.name}</span>
    </Link>
  );
}
