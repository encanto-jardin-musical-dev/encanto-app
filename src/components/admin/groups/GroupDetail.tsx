"use client";
import useGroupByIdQuery from "@/hooks/UseGroupByIdQuery";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { EntityAvatarChip } from "@/components/common/EntityAvatarChip";
import { EntityChipSection } from "@/components/common/EntityChipSection";

type GroupDetailProps = {
  groupID: string;
};

export function GroupDetail({ groupID }: GroupDetailProps) {
  const t = useTranslations("AdminGroups.detail");
  const { data: group, isLoading } = useGroupByIdQuery(groupID);

  if (isLoading) {
    return <p className="text-center text-default-400 py-8">…</p>;
  }

  if (!group) {
    return <p className="text-center text-default-500 py-8">—</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identity header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center shrink-0 overflow-hidden">
          {group.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <PhotoIcon className="w-10 h-10 text-default-400" />
          )}
        </div>
        <h2 className="text-xl font-bold">{group.name}</h2>
      </div>

      {/* Teachers */}
      <EntityChipSection
        title={t("teachersTitle")}
        headingLevel="h3"
        emptyLabel={t("noTeachers")}
        items={group.teachers}
        renderChip={(teacher) => (
          <EntityAvatarChip
            key={teacher.id}
            fallbackIcon={UserCircleIcon}
            fallbackIconClassName="w-10 h-10 text-default-400"
            shape="circle"
            size="w-16 h-16"
            chipWidth="w-20"
            label={`${teacher.first_name} ${teacher.last_name}`}
          />
        )}
      />

      {/* Children */}
      <EntityChipSection
        title={t("childrenTitle")}
        headingLevel="h3"
        emptyLabel={t("noChildren")}
        items={group.children}
        renderChip={(child) => (
          <EntityAvatarChip
            key={child.id}
            imageUrl={child.avatar_url}
            fallbackIcon={UserCircleIcon}
            fallbackIconClassName="w-10 h-10 text-default-400"
            shape="circle"
            size="w-16 h-16"
            chipWidth="w-20"
            label={`${child.first_name} ${child.last_name}`}
          />
        )}
      />
    </div>
  );
}
