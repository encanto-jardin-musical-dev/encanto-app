"use client";

import { EntityListItemLink } from "@/components/common/EntityListItemLink";
import { receiverAtom } from "@/lib/store/messages";
import { UserContact } from "@/types/messages.types";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";

type UserListItemProps = {
  user: UserContact;
};

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string }
>;

const ROLE_ICONS: Record<string, IconComponent> = {
  teacher: AcademicCapIcon,
  admin: ShieldCheckIcon,
  parent: UserIcon,
};

export default function UserListItem({
  user: { id, first_name, last_name, role, avatar_url },
}: UserListItemProps) {
  const t = useTranslations("MessagesContacts");
  const [, setReceiver] = useAtom(receiverAtom);
  const fullName = useMemo(
    () => `${first_name} ${last_name}`,
    [first_name, last_name],
  );
  const handleContactClick = () => {
    setReceiver({ id, last_name, first_name, role, avatar_url });
  };
  const RoleIcon = ROLE_ICONS[role] ?? UserIcon;
  const roleLabel = t.has(`role.${role}`) ? t(`role.${role}`) : role;
  const subtitle = (
    <>
      <RoleIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{roleLabel}</span>
    </>
  );
  return (
    <div className="contents" onClick={handleContactClick}>
      <EntityListItemLink
        href={`/messages/${id}`}
        imageUrl={avatar_url}
        imageAlt={fullName}
        fallbackIcon={UserCircleIcon}
        title={fullName}
        subtitle={subtitle}
        variant="card"
      />
    </div>
  );
}
