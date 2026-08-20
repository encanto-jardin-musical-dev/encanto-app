'use client';
import {
  AcademicCapIcon,
  FaceSmileIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { AdminShortcutTile } from './AdminShortcutTile';

const SHORTCUT_TILES = [
  { key: 'groups', icon: UserGroupIcon, route: '/admin/groups' },
  { key: 'children', icon: FaceSmileIcon, route: '/admin/children' },
  { key: 'teachers', icon: AcademicCapIcon, route: '/admin/teachers' },
  { key: 'parents', icon: UsersIcon, route: '/admin/parents' },
  { key: 'attendance', icon: ClockIcon, route: '/admin/attendance' },
] as const;

export function AdminShortcuts() {
  const t = useTranslations('AdminOptionsPage');
  // Hooks run unconditionally; undefined (loading) is treated as off.
  const cleanupEnabled = useFeatureFlagEnabled('admin_cleanup') === true;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-default-500">{t('sections.shortcuts')}</p>
      <div className="grid grid-cols-3 gap-4 justify-items-center">
        {SHORTCUT_TILES.map(({ key, icon, route }) => (
          <AdminShortcutTile
            key={key}
            icon={icon}
            label={t(`tiles.${key}`)}
            route={route}
          />
        ))}
        {cleanupEnabled && (
          <AdminShortcutTile
            icon={TrashIcon}
            label={t('tiles.cleanup')}
            route="/admin/cleanup"
          />
        )}
      </div>
    </div>
  );
}
