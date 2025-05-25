"use client";

import { getAllGroups, getUserChildren, getUserGroups } from "@/queries/user";
import { Avatar, Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  userRoleAtom,
  userSelectOptionsAtom,
  userIdAtom,
  userGroupIdAtom,
} from "@/lib/store/user";
import { groupContextSelectedAtom } from "@/lib/store";
import type { UserChildren } from "@/types/messages.types";
import type { UserProfile } from "@/types/auth.types";
import type { Key } from "@react-types/shared";

type FeedUserProps = {
  user: UserProfile;
};

export default function FeedUser({ user }: FeedUserProps) {
  const { id, role } = user;
  const [selectOptions, setSelectOptions] = useAtom(userSelectOptionsAtom);
  const [groupContextSelection, setGroupContextSelection] = useAtom(
    groupContextSelectedAtom,
  );

  const [, setUserRole] = useAtom(userRoleAtom);
  const [, setUserId] = useAtom(userIdAtom);
  const [, setUserGroup] = useAtom(userGroupIdAtom);
  const t = useTranslations("UserFeedPage.FeedUser");

  useEffect(() => {
    if (id) setUserId(id);
    if (role) setUserRole(role);

  }, [id, role, setUserId, setUserRole]);

  const getSelectOptions = useCallback(async () => {
    if (user?.role === "admin") {
      const rawAllGroups = await getAllGroups();
      const formatedGroups = Array.isArray(rawAllGroups)
        ? rawAllGroups.map((group) => ({
          key: group?.id as Key,
          label: group?.name,
        }))
        : [];
      setSelectOptions(formatedGroups);
    } else if (user?.role === "teacher") {
      const rawUserGroups = await getUserGroups(user?.id);
      setUserGroup(rawUserGroups.find((group) => group.teacher_id === user.id).id);
      const formatedGroups = Array.isArray(rawUserGroups)
        ? rawUserGroups.map((group) => ({
          key: group?.id as Key,
          label: group?.name,
        }))
        : [];
      setSelectOptions(formatedGroups);
    } else {
      const rawUserChildren: UserChildren[] | unknown = await getUserChildren();
      const formatedChildren = Array.isArray(rawUserChildren)
        ? rawUserChildren.map((child) => ({
          key: child?.children?.child_group[0]?.group_id as Key,
          label: `${child?.children?.first_name} ${child?.children?.last_name}`,
        }))
        : [];
      setSelectOptions(formatedChildren);
    }
  }, [user?.role, user.id, setSelectOptions, setUserGroup]);

  useEffect(() => {
    getSelectOptions();
  }, [getSelectOptions]);

  useEffect(() => {
    if (selectOptions.length > 0 && groupContextSelection === undefined) {
      if (selectOptions[0]?.key !== undefined) {
        const initialValue = new Set([selectOptions[0].key]);
        setGroupContextSelection(initialValue);
      }
    }
  }, [selectOptions, groupContextSelection, setGroupContextSelection]);

  const getSelectPlaceholder = () => {
    if (user?.role === "admin" || user?.role === "teacher") {
      return t("placeholders.other", { count: selectOptions.length });
    }
    return t("placeholders.parent", { count: selectOptions.length });
  };

  const getSelectLabel = () => {
    if (user?.role === "admin" || user?.role === "teacher") {
      return t("labels.other", { count: selectOptions.length });
    }
    return t("labels.parent", { count: selectOptions.length });
  };

  return (
    <div className="w-full">
      <h1>
        {t("greeting", {
          name: `${user?.first_name} ${user?.last_name}`,
        })}
      </h1>
      <div className="flex w-full gap-4 pt-4">
        <div>
          <Avatar size="lg" name={user?.first_name} color="primary" />
        </div>
        <Select
          label={getSelectLabel()}
          items={selectOptions}
          placeholder={getSelectPlaceholder()}
          selectedKeys={groupContextSelection}
          onSelectionChange={setGroupContextSelection}
          isDisabled={user.role === "teacher"}
        >
          {(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
        </Select>
      </div>
    </div>
  );
}
