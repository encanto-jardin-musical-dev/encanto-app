"use client";
import useChildrenListQuery from "@/hooks/UseChildrenListQuery";
import { useInfiniteScrollSentinel } from "@/hooks/UseInfiniteScrollSentinel";
import { useTranslations } from "next-intl";
import { ChildListItem } from "./ChildListItem";

type ChildrenListProps = {
  search: string;
};

export function ChildrenList({ search }: ChildrenListProps) {
  const t = useTranslations("AdminChildren.list");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useChildrenListQuery(search);
  const sentinelRef = useInfiniteScrollSentinel({ fetchNextPage, hasNextPage, isFetchingNextPage });

  const children = data?.pages.flatMap((page) => page) ?? [];

  if (children.length === 0 && !isFetchingNextPage) {
    return <p className="text-center text-default-500 py-8">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {children.map((child) => (
        <ChildListItem key={child.id} child={child} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-small text-default-400 py-2">…</p>
      )}
    </div>
  );
}
