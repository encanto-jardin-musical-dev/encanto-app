"use client";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import type { ParentListRow } from "@/queries/parents/get-parents-page";
import { EntityListItemLink } from "@/components/common/EntityListItemLink";
import { useTranslations } from "next-intl";

type ParentListItemProps = {
  parent: ParentListRow;
};

export function ParentListItem({ parent }: ParentListItemProps) {
  const t = useTranslations("AdminParents.list");

  const childNames = parent.children
    .map((c) => `${c.first_name} ${c.last_name}`)
    .join(", ");

  const subtitle = childNames ? (
    <span className="truncate">{childNames}</span>
  ) : (
    <span className="truncate text-default-400">{t("noChildren")}</span>
  );

  return (
    <EntityListItemLink
      href={`/admin/parents/${parent.id}`}
      imageUrl={parent.avatar_url}
      imageAlt={`${parent.first_name} ${parent.last_name}`}
      fallbackIcon={UserCircleIcon}
      title={`${parent.first_name} ${parent.last_name}`}
      subtitle={subtitle}
      variant="card"
    />
  );
}
