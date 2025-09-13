'use client';

import { userContactsAtom } from '@/lib/store/messages';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import UserListItem from '../common/UserListItem';
import { userAtom } from '@/lib/store/user';
import useUserContactsQuery from '@/hooks/UseGetUserContactsQuery';
import SearchBar from '../common/SearchBar';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export default function MessagesContactsList() {
  const [userContacts, setUserContacts] = useAtom(userContactsAtom);
  const [user] = useAtom(userAtom);
  const flagSearchBar = useFeatureFlagEnabled('messages_search_bar');

  const { data: contacts } = useUserContactsQuery({
    params: { userID: user.id, userRole: user.role },
    options: { enabled: !!user.id && !!user.role },
  });

  useEffect(() => {
    if (contacts) {
      setUserContacts(contacts);
    }
  }, [contacts, setUserContacts]);

  if (!userContacts.length) {
    return <div className="text-center p-4">No contacts found</div>;
  }

  return (
    <section className="flex flex-col gap-3 overflow-y-auto">
      {flagSearchBar && <SearchBar />}
      {userContacts.map(user => (
        <UserListItem user={user} key={user?.id} />
      ))}
    </section>
  );
}
