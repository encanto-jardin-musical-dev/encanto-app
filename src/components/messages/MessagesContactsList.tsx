'use client';

import { AdminSearchBar } from '@/components/common/AdminSearchBar';
import useUserChildrenQuery from '@/hooks/UseGetUserChildrenQuery';
import useUserContactsQuery from '@/hooks/UseGetUserContactsQuery';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import { UserRoles } from '@/types/common.types';
import { Chip, Skeleton } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useMemo, useState } from 'react';
import UserListItem from '../common/UserListItem';

type RoleFilterOption = {
  role: UserRoles;
  labelKey: string;
};

// Open/Closed: adding a new role only requires a new entry here — no structural changes.
const ROLE_FILTER_OPTIONS: RoleFilterOption[] = [
  { role: 'admin', labelKey: 'filter.admin' },
  { role: 'teacher', labelKey: 'filter.teacher' },
  { role: 'parent', labelKey: 'filter.parent' },
];

const SKELETON_COUNT = 6;

function ContactsListSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="bg-default-100 rounded-lg p-2 flex items-center gap-3">
          {/* Avatar */}
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          {/* Text lines */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/4 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function MessagesContactsList() {
  const user = useAtomValue(userAtom);
  const t = useTranslations('MessagesContacts');
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState<UserRoles | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isParent = user.role === USER_ROLES.PARENT;

  const handleRoleToggle = useCallback((role: UserRoles) => {
    setActiveRole(prev => (prev === role ? null : role));
  }, []);

  const handleChildToggle = useCallback((childId: string) => {
    setSelectedChildId(prev => (prev === childId ? null : childId));
  }, []);

  const { data: userChildren } = useUserChildrenQuery({
    params: { userID: user.id },
    options: { enabled: isParent && !!user.id },
  });

  const childOptions = useMemo(() => {
    if (!Array.isArray(userChildren)) return [];
    return userChildren
      .map(guardian => guardian?.children)
      .filter((child): child is NonNullable<typeof child> => !!child)
      .map(child => ({ id: child.id, label: `${child.first_name} ${child.last_name}` }));
  }, [userChildren]);

  const { data: contacts, isPending } = useUserContactsQuery({
    params: {
      userID: user.id,
      userRole: user.role,
      roleFilter: activeRole ?? undefined,
      childFilter: selectedChildId ?? undefined,
    },
    options: { enabled: !!user.id && !!user.role },
  });

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts ?? [];
    return (contacts ?? []).filter(contact =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query),
    );
  }, [contacts, search]);

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 overflow-hidden">
      <div className="flex flex-col gap-3">
        <AdminSearchBar placeholder={t('searchPlaceholder')} onSearch={setSearch} />
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {ROLE_FILTER_OPTIONS.map(({ role, labelKey }) => (
              <Chip
                key={role}
                radius="sm"
                color={activeRole === role ? 'primary' : 'default'}
                variant={activeRole === role ? 'solid' : 'flat'}
                className="cursor-pointer"
                onClick={() => handleRoleToggle(role)}
                endContent={
                  activeRole === role ? (
                    <XMarkIcon className="w-3.5 h-3.5" />
                  ) : undefined
                }
              >
                {t(labelKey)}
              </Chip>
            ))}
          </div>
        )}
        {isParent && childOptions.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {childOptions.map(({ id, label }) => (
              <Chip
                key={id}
                radius="sm"
                color={selectedChildId === id ? 'primary' : 'default'}
                variant={selectedChildId === id ? 'solid' : 'flat'}
                className="cursor-pointer"
                onClick={() => handleChildToggle(id)}
                endContent={
                  selectedChildId === id ? (
                    <XMarkIcon className="w-3.5 h-3.5" />
                  ) : undefined
                }
              >
                {label}
              </Chip>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto">
        {isPending ? (
          <ContactsListSkeleton />
        ) : filteredContacts.length === 0 ? (
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
