"use client";
import useGroupsListQuery from "@/hooks/UseGroupsListQuery";
import { useInfiniteScrollSentinel } from "@/hooks/UseInfiniteScrollSentinel";
import { useTranslations } from "next-intl";
import { GroupListItem } from "./GroupListItem";

type GroupsListProps = {
  search: string;
};

export function GroupsList({ search }: GroupsListProps) {
  const t = useTranslations("AdminGroups.list");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGroupsListQuery(search);
  const sentinelRef = useInfiniteScrollSentinel({ fetchNextPage, hasNextPage, isFetchingNextPage });

  const groups = data?.pages.flatMap((page) => page) ?? [];

  if (groups.length === 0 && !isFetchingNextPage) {
    return <p className="text-center text-default-500 py-8">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <GroupListItem key={group.id} group={group} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-small text-default-400 py-2">…</p>
      )}
    </div>
  );
}
