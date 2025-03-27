"use client";

import { receiverAtom } from "@/lib/store/messages";
import { Avatar } from "@heroui/react";
import { useAtomValue } from "jotai";

export default function MessagesUserData() {
  const receiver = useAtomValue(receiverAtom);
  return (
    <div className="flex first-letter: items-center gap-4">
      <div>
        <Avatar
          size="md"
          name={`${receiver?.first_name} ${receiver?.last_name}`}
          color="primary"
        />
      </div>
      <h1>{`${receiver?.first_name} ${receiver?.last_name}`}</h1>
    </div>
  );
}
