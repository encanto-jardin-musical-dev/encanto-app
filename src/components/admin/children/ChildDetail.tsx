"use client";
import useChildByIdQuery from "@/hooks/UseChildByIdQuery";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { ChildGroupsSection } from "./ChildGroupsSection";
import { ChildParentsSection } from "./ChildParentsSection";

type ChildDetailProps = {
  childID: string;
};

export function ChildDetail({ childID }: ChildDetailProps) {
  const tForm = useTranslations("AdminChildren.form");
  const { data: child, isLoading } = useChildByIdQuery(childID);

  if (isLoading) {
    return <p className="text-center text-default-400 py-8">…</p>;
  }

  if (!child) {
    return <p className="text-center text-default-500 py-8">—</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identity header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center shrink-0 overflow-hidden">
          {child.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.avatar_url} alt={`${child.first_name} ${child.last_name}`} className="w-full h-full object-cover" />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-default-400" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-small text-default-500">
            {tForm(`gender.${child.gender}`)}
          </span>
          <h2 className="text-xl font-bold">
            {child.first_name} {child.last_name}
          </h2>
          <span className="text-small text-default-500">
            {tForm(`idType.${child.document_type}`)} · {child.document_number}
          </span>
          <span className="text-small text-default-500">{child.birth_date}</span>
          {child.address && (
            <span className="text-small text-default-500">{child.address}</span>
          )}
        </div>
      </div>

      {/* Groups */}
      <ChildGroupsSection groups={child.groups} />

      {/* Parents */}
      <ChildParentsSection guardians={child.guardians} />
    </div>
  );
}
