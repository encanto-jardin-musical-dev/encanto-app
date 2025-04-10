"use client";

import { userContactsAtom } from "@/lib/store/messages";
import { getUserContacts } from "@/queries/messages";
import { useAtom } from "jotai";
import { useEffect } from "react";
import UserListItem from "../common/UserListItem";

export default function MessagesContactsList() {
  const [userContacts, setUserContacts] = useAtom(userContactsAtom);

  useEffect(() => {
    let mounted = true;

    const fetchUserContacts = async () => {
      try {
        const { data: contacts } = await getUserContacts();
        if (!mounted || !contacts) return;
        setUserContacts(contacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchUserContacts();

    return () => {
      mounted = false;
    };
  }, [setUserContacts]);

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
