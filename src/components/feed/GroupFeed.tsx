"use client";

import { groupMessagesAtom } from "@/lib/store/feed";
import { userCurrentSelectionAtom } from "@/lib/store/user";
import { getUserMessages } from "@/queries/user";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Message } from "@/types/messages.types";
import MessageCard from "./MessageCard";

export default function GroupFeed() {
  const [selectedContext] = useAtom(userCurrentSelectionAtom);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);
  const groupId = useMemo(() => {
    const selectedValue = selectedContext as Set<string | number>;
    return selectedValue ? selectedValue.values().next().value : "";
  }, [selectedContext]);

  const getGroupMessages = useCallback(async () => {
    const allUserMessages = await getUserMessages();
    setGroupMessages(allUserMessages as unknown as Message[]);
  }, [setGroupMessages]);

  useEffect(() => {
    if (selectedContext) {
      getGroupMessages();
    }
  }, [selectedContext, getGroupMessages]);

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        {Array.isArray(groupMessages)
          ? groupMessages
              .filter(
                (message) =>
                  message.from?.groups[0]?.group_id === groupId ||
                  message.from?.role === "admin",
              )
              .map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
          : []}
      </div>
    </>
  );
}
