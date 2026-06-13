"use client";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { UsersIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import type { ChildListRow } from "@/queries/children/get-children-page";

type ChildListItemProps = {
  child: ChildListRow;
};

export function ChildListItem({ child }: ChildListItemProps) {
  return (
    <Link
      href={`/admin/children/${child.id}`}
      className="flex items-center gap-3 py-3 px-1 border-b border-divider last:border-0 active:opacity-70"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-default-100 flex items-center justify-center shrink-0">
        {child.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={child.avatar_url} alt={`${child.first_name} ${child.last_name}`} className="w-full h-full object-cover" />
        ) : (
          <UserCircleIcon className="w-7 h-7 text-default-400" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-foreground truncate">
          {child.first_name} {child.last_name}
        </span>
        {child.parentName && (
          <span className="flex items-center gap-1 text-small text-default-500 truncate">
            <UsersIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{child.parentName}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
