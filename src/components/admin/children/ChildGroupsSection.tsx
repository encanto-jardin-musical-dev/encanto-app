import { PhotoIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

type Group = { id: string; name: string; image_url: string | null };

type ChildGroupsSectionProps = {
  groups: Group[];
};

export function ChildGroupsSection({ groups }: ChildGroupsSectionProps) {
  const t = useTranslations("AdminChildren.detail");

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-foreground">{t("groupsTitle")}</h2>
      {groups.length === 0 ? (
        <p className="text-small text-default-500">{t("noGroups")}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col items-center gap-1 w-20"
            >
              <div className="w-16 h-16 rounded-xl bg-default-100 flex items-center justify-center overflow-hidden">
                {group.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <PhotoIcon className="w-8 h-8 text-default-400" />
                )}
              </div>
              <span className="text-xs text-center text-default-600 leading-tight">{group.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
