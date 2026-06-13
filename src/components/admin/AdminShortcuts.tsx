"use client";
import {
  AcademicCapIcon,
  FaceSmileIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { AdminShortcutTile } from "./AdminShortcutTile";

const SHORTCUT_TILES = [
  { key: "groups", icon: UserGroupIcon, route: "/admin-options/groups" },
  { key: "children", icon: FaceSmileIcon, route: "/admin-options/children" },
  { key: "teachers", icon: AcademicCapIcon, route: "/admin-options/teachers" },
  { key: "parents", icon: UsersIcon, route: "/admin-options/parents" },
] as const;

export function AdminShortcuts() {
  const t = useTranslations("AdminOptionsPage");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-default-500">{t("sections.shortcuts")}</p>
      <div className="flex gap-4">
        {SHORTCUT_TILES.map(({ key, icon, route }) => (
          <AdminShortcutTile
            key={key}
            icon={icon}
            label={t(`tiles.${key}`)}
            route={route}
          />
        ))}
      </div>
    </div>
  );
}
