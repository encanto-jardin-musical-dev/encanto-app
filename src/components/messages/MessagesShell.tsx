"use client";

import NavigationBar from "@/components/common/NavigationBar";
import MessagesContactsList from "@/components/messages/MessagesContactsList";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function MessagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("ActionButton.actions");
  const isConversation =
    pathname.startsWith("/messages/") && pathname !== "/messages";

  return (
    <div className="grid h-full md:grid-cols-[20rem_1fr] gap-0 md:gap-4 p-4">
      <section
        className={[
          "flex flex-col gap-4 min-h-0 h-full",
          isConversation ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <NavigationBar backRoute="/feed" pageTitle={t("messages")} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessagesContactsList />
        </div>
      </section>

      <section
        className={[
          "min-h-0 h-full min-w-0",
          isConversation ? "flex flex-col" : "hidden md:flex md:flex-col",
        ].join(" ")}
      >
        {children}
      </section>
    </div>
  );
}
