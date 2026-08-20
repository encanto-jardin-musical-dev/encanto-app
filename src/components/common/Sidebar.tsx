'use client';

import { AvatarEditModal } from '@/components/feed/AvatarEditModal';
import { useNavItems } from '@/hooks/UseNavItems';
import {
  userAtom,
  userAvatarAtom,
  userFirstNameAtom,
  userLastNameAtom,
  userRoleAtom,
} from '@/lib/store/user';
import { getSignedAvatarUrl } from '@/utils/avatars';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Avatar, Button, useDisclosure } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function isActiveRoute(pathname: string, route: string): boolean {
  if (route === '/feed') {
    return pathname === '/feed' || pathname.startsWith('/feed/');
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function Sidebar() {
  const tActions = useTranslations('ActionButton.actions');
  const tSidebar = useTranslations('Sidebar');
  const t = useTranslations('UserFeedPage.FeedUser');
  const items = useNavItems();
  const pathname = usePathname();
  const firstName = useAtomValue(userFirstNameAtom);
  const lastName = useAtomValue(userLastNameAtom);
  const role = useAtomValue(userRoleAtom);
  const avatarPath = useAtomValue(userAvatarAtom);
  const user = useAtomValue(userAtom);
  const setUserAvatar = useSetAtom(userAvatarAtom);
  const displayName = [firstName, lastName].filter(Boolean).join(' ');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedAvatarUrl(role, avatarPath).then(url => {
      if (!cancelled) setSignedAvatarUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [role, avatarPath]);

  const handleAvatarSaved = (newUrl: string | null) => {
    setSignedAvatarUrl(newUrl);
    setUserAvatar(newUrl ?? '');
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-60';

  return (
    <aside
      className={[
        'hidden md:flex md:flex-col shrink-0 h-full border-r border-default-200 bg-background transition-all duration-200',
        sidebarWidth,
      ].join(' ')}
    >
      <div className="relative flex items-center px-4 py-5 min-h-[4.5rem]">
        <div className="flex items-center gap-3 overflow-hidden">
          <Image
            src="/icon.png"
            alt="Encanto"
            width={48}
            height={48}
            className="h-12 w-12 object-contain shrink-0"
          />
          {!isCollapsed && (
            <span className="font-bold text-primary text-lg whitespace-nowrap">
              {tSidebar('appName')}
            </span>
          )}
        </div>
        <Button
          isIconOnly
          variant="solid"
          size="sm"
          radius="full"
          aria-label={
            isCollapsed ? tSidebar('toggleExpand') : tSidebar('toggleCollapse')
          }
          onPress={() => setIsCollapsed(prev => !prev)}
          className="absolute -right-[1.15rem] top-1/2 -translate-y-1/2 bg-primary text-white border border-default-200 shadow-md"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav
        aria-label={tSidebar('navLabel')}
        className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto"
      >
        {items.map(({ key, route, icon: Icon }) => {
          const label = tActions(key);
          const active = isActiveRoute(pathname, route);
          return (
            <Link
              key={key}
              href={route}
              aria-current={active ? 'page' : undefined}
              title={isCollapsed ? label : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-default-100',
                isCollapsed && 'justify-center',
              ].join(' ')}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        aria-label={tSidebar('userLabel')}
        className={[
          'flex items-center gap-3 border-t border-default-200 px-4 py-4',
          isCollapsed && 'justify-center',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onOpen}
          className="active:opacity-70 shrink-0"
          aria-label={t('avatarModal.openAriaLabel')}
        >
          <Avatar
            src={signedAvatarUrl ?? undefined}
            name={displayName || undefined}
            size="sm"
            showFallback
          />
        </button>
        {!isCollapsed && (
          <span className="text-sm font-medium truncate">
            {displayName || '—'}
          </span>
        )}
      </div>

      <AvatarEditModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        userId={user.id}
        userRole={user.role}
        currentAvatarUrl={signedAvatarUrl}
        onSaved={handleAvatarSaved}
      />
    </aside>
  );
}
