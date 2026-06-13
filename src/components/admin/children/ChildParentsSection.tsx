import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

type Guardian = {
  id: string;
  first_name: string;
  last_name: string;
};

type ChildParentsSectionProps = {
  guardians: Guardian[];
};

export function ChildParentsSection({ guardians }: ChildParentsSectionProps) {
  const t = useTranslations("AdminChildren.detail");

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-foreground">{t("parentsTitle")}</h2>
      {guardians.length === 0 ? (
        <p className="text-small text-default-500">{t("noParents")}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="flex flex-col items-center gap-1 w-24"
            >
              <div className="w-14 h-14 rounded-full bg-default-100 flex items-center justify-center overflow-hidden">
                <UserCircleIcon className="w-9 h-9 text-default-400" />
              </div>
              <span className="text-xs text-center text-default-600 leading-tight">
                {guardian.first_name} {guardian.last_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
