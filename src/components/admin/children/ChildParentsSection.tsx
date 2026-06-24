import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { EntityAvatarChip } from "@/components/common/EntityAvatarChip";
import { EntityChipSection } from "@/components/common/EntityChipSection";

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
    <EntityChipSection
      title={t("parentsTitle")}
      emptyLabel={t("noParents")}
      items={guardians}
      renderChip={(guardian) => (
        <EntityAvatarChip
          key={guardian.id}
          fallbackIcon={UserCircleIcon}
          fallbackIconClassName="w-9 h-9 text-default-400"
          shape="circle"
          size="w-14 h-14"
          chipWidth="w-24"
          label={`${guardian.first_name} ${guardian.last_name}`}
        />
      )}
    />
  );
}
