"use client";

import { userContactsAtom } from "@/lib/store/messages";
import { getProfilesByGuardian, getUserContacts } from "@/queries/messages";
import { useAtom } from "jotai";
import { useEffect } from "react";
import UserListItem from "../common/UserListItem";
import { userAtom } from "@/lib/store/user";

export default function MessagesContactsList() {
  const [userContacts, setUserContacts] = useAtom(userContactsAtom);
  const [user] = useAtom(userAtom);

  useEffect(() => {
    let mounted = true;

    const fetchUserContacts = async () => {
      try {
        if (user.role === "parent") {
          const { data: contacts } = await getProfilesByGuardian();
          setUserContacts(contacts);
          return;
        }
        const { data: contacts } = await getUserContacts(user.id);
        if (!mounted || !contacts) return;
        setUserContacts(contacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    fetchUserContacts();

    return () => {
      mounted = false;
    };
  }, [setUserContacts, user.id, user.role]);

  if (!userContacts.length) {
    return <div className="text-center p-4">No contacts found</div>;
  }

  return (
    <section className="flex flex-col gap-3 overflow-y-auto">
      {userContacts.map((user) => (
        <UserListItem user={user} key={user?.id} />
      ))}
    </section>
  );
}
