"use client";

import { USER_ROLES } from "@/lib/const";
import { receiverAtom } from "@/lib/store/messages";
import { UserContact } from "@/types/messages.types";
import { User } from "@heroui/react";
import { useAtom } from "jotai";
import Link from "next/link";
import { useMemo } from "react";

type UserListItemProps = {
  user: UserContact;
};

export default function UserListItem({
  user: { id, first_name, last_name, role, avatar_url },
}: UserListItemProps) {
  const [, setReceiver] = useAtom(receiverAtom);
  const fullUserName = useMemo(
    () => `${first_name} ${last_name}`,
    [first_name, last_name],
  );
  const handleContactClick = () => {
    setReceiver({ id, last_name, first_name, role, avatar_url });
  };
  return (
    <Link
      href={`/messages/${id}`}
      onClick={handleContactClick}
      className="bg-default-100 rounded-lg p-2 text-default-900"
    >
      <User
        avatarProps={{
          src: avatar_url ?? undefined,
          showFallback: true,
          name: fullUserName.toUpperCase(),
          color: role === USER_ROLES.ADMIN ? "primary" : "default",
        }}
        name={fullUserName}
        description={role}
      />
    </Link>
  );
}
