'use client';

import { AdminSearchBar } from '@/components/common/AdminSearchBar';
import useUserContactsQuery from '@/hooks/UseGetUserContactsQuery';
import { userAtom } from '@/lib/store/user';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import UserListItem from '../common/UserListItem';

export default function MessagesContactsList() {
  const user = useAtomValue(userAtom);
  const t = useTranslations('MessagesContacts');
  const [search, setSearch] = useState('');

  const { data: contacts, isPending } = useUserContactsQuery({
    params: { userID: user.id, userRole: user.role },
    options: { enabled: !!user.id && !!user.role },
  });

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts ?? [];
    return (contacts ?? []).filter(contact =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query),
    );
  }, [contacts, search]);

  if (isPending) {
    return <div className="text-center p-4">{t('empty')}</div>;
  }

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 overflow-hidden">
      <AdminSearchBar placeholder={t('searchPlaceholder')} onSearch={setSearch} />
      <div className="flex flex-col gap-3 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <p className="text-center text-default-500 py-8">{t('empty')}</p>
        ) : (
          filteredContacts.map(contact => (
            <UserListItem user={contact} key={contact?.id} />
          ))
        )}
      </div>
    </section>
  );
}
