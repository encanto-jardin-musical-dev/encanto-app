'use client';

import { userAtom } from '@/lib/store/user';
import useUserContactsQuery from '@/hooks/UseGetUserContactsQuery';
import UserListItem from '../common/UserListItem';
import SearchBar from '../common/SearchBar';
import { useAtomValue } from 'jotai';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export default function MessagesContactsList() {
  const user = useAtomValue(userAtom);
  const flagSearchBar = useFeatureFlagEnabled('messages_search_bar');

  const { data: contacts, isPending } = useUserContactsQuery({
    params: { userID: user.id, userRole: user.role },
    options: { enabled: !!user.id && !!user.role },
  });

  if (isPending || !contacts?.length) {
    return <div className="text-center p-4">No contacts found</div>;
  }

  return (
    <section className="flex flex-col gap-3 overflow-y-auto">
      {flagSearchBar && <SearchBar />}
      {contacts.map(contact => (
        <UserListItem user={contact} key={contact?.id} />
      ))}
    </section>
  );
}
