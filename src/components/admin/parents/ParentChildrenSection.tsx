import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { EntityAvatarChip } from "@/components/common/EntityAvatarChip";
import { EntityChipSection } from "@/components/common/EntityChipSection";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
};

type ParentChildrenSectionProps = {
  linkedChildren: Child[];
};

export function ParentChildrenSection({ linkedChildren }: ParentChildrenSectionProps) {
  const t = useTranslations("AdminParents.detail");

  return (
    <EntityChipSection
      title={t("childrenTitle")}
      emptyLabel={t("noChildren")}
      items={linkedChildren}
      renderChip={(child) => (
        <EntityAvatarChip
          key={child.id}
          imageUrl={child.avatar_url ?? null}
          fallbackIcon={UserCircleIcon}
          fallbackIconClassName="w-9 h-9 text-default-400"
          shape="circle"
          size="w-14 h-14"
          chipWidth="w-24"
          label={`${child.first_name} ${child.last_name}`}
        />
      )}
    />
  );
}
