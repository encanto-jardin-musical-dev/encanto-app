"use client";
import useGroupByIdQuery from "@/hooks/UseGroupByIdQuery";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

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
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-foreground">{t("teachersTitle")}</h3>
        {group.teachers.length === 0 ? (
          <p className="text-small text-default-500">{t("noTeachers")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {group.teachers.map((teacher) => (
              <div key={teacher.id} className="flex flex-col items-center gap-1 w-20">
                <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center">
                  <UserCircleIcon className="w-10 h-10 text-default-400" />
                </div>
                <span className="text-xs text-center text-default-600 leading-tight">
                  {teacher.first_name} {teacher.last_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Children */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-foreground">{t("childrenTitle")}</h3>
        {group.children.length === 0 ? (
          <p className="text-small text-default-500">{t("noChildren")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {group.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center gap-1 w-20">
                <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center overflow-hidden">
                  {child.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={child.avatar_url}
                      alt={`${child.first_name} ${child.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-10 h-10 text-default-400" />
                  )}
                </div>
                <span className="text-xs text-center text-default-600 leading-tight">
                  {child.first_name} {child.last_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
