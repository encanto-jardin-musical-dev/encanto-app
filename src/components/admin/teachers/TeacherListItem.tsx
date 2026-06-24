"use client";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon } from "@heroicons/react/24/solid";
import type { TeacherListRow } from "@/queries/teachers/get-teachers-page";
import { EntityListItemLink } from "@/components/common/EntityListItemLink";
import { useTranslations } from "next-intl";

type TeacherListItemProps = {
  teacher: TeacherListRow;
};

export function TeacherListItem({ teacher }: TeacherListItemProps) {
  const t = useTranslations("AdminTeachers.form");
  const subtitle = (
    <>
      <AcademicCapIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{t(`role.teacher`)}</span>
    </>
  );

  return (
    <EntityListItemLink
      href={`/admin/teachers/${teacher.id}`}
      imageUrl={teacher.avatar_url}
      imageAlt={`${teacher.first_name} ${teacher.last_name}`}
      fallbackIcon={UserCircleIcon}
      title={`${teacher.first_name} ${teacher.last_name}`}
      subtitle={subtitle}
      variant="card"
    />
  );
}
