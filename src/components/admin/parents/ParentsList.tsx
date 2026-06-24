"use client";
import useParentsListQuery from "@/hooks/UseParentsListQuery";
import { useInfiniteScrollSentinel } from "@/hooks/UseInfiniteScrollSentinel";
import { useTranslations } from "next-intl";
import { ParentListItem } from "./ParentListItem";

type ParentsListProps = {
  search: string;
};

export function ParentsList({ search }: ParentsListProps) {
  const t = useTranslations("AdminParents.list");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useParentsListQuery(search);
  const sentinelRef = useInfiniteScrollSentinel({ fetchNextPage, hasNextPage, isFetchingNextPage });

  const parents = data?.pages.flatMap((page) => page) ?? [];

  if (parents.length === 0 && !isFetchingNextPage) {
    return <p className="text-center text-default-500 py-8">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {parents.map((parent) => (
        <ParentListItem key={parent.id} parent={parent} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-small text-default-400 py-2">…</p>
      )}
    </div>
  );
}
