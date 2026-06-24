"use client";
import useTeachersListQuery from "@/hooks/UseTeachersListQuery";
import { useInfiniteScrollSentinel } from "@/hooks/UseInfiniteScrollSentinel";
import { useTranslations } from "next-intl";
import { TeacherListItem } from "./TeacherListItem";

type TeachersListProps = {
  search: string;
};

export function TeachersList({ search }: TeachersListProps) {
  const t = useTranslations("AdminTeachers.list");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTeachersListQuery(search);
  const sentinelRef = useInfiniteScrollSentinel({ fetchNextPage, hasNextPage, isFetchingNextPage });

  const teachers = data?.pages.flatMap((page) => page) ?? [];

  if (teachers.length === 0 && !isFetchingNextPage) {
    return <p className="text-center text-default-500 py-8">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {teachers.map((teacher) => (
        <TeacherListItem key={teacher.id} teacher={teacher} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-small text-default-400 py-2">…</p>
      )}
    </div>
  );
}
