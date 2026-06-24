import { PhotoIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { EntityAvatarChip } from "@/components/common/EntityAvatarChip";
import { EntityChipSection } from "@/components/common/EntityChipSection";

type Group = { id: string; name: string; image_url: string | null };

type ChildGroupsSectionProps = {
  groups: Group[];
};

export function ChildGroupsSection({ groups }: ChildGroupsSectionProps) {
  const t = useTranslations("AdminChildren.detail");

  return (
    <EntityChipSection
      title={t("groupsTitle")}
      emptyLabel={t("noGroups")}
      items={groups}
      renderChip={(group) => (
        <EntityAvatarChip
          key={group.id}
          imageUrl={group.image_url}
          fallbackIcon={PhotoIcon}
          fallbackIconClassName="w-8 h-8 text-default-400"
          shape="square"
          size="w-16 h-16"
          chipWidth="w-20"
          label={group.name}
        />
      )}
    />
  );
}
