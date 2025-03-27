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
import { UserChildren } from "@/types/messages.types";
import { UserProfile } from "@/types/auth.types";

type FeedUserProps = {
  user: UserProfile;
};

export default function FeedUser({ user }: FeedUserProps) {
  const [selectOptions, setSelectOptions] = useAtom(userSelectOptionsAtom);
  const [groupContextValue, setGroupContextValue] = useAtom(
    groupContextSelectedAtom,
  );

  // TODO: refactor to handle the user info in a derived atom
  const [, setUserRole] = useAtom(userRoleAtom);
  const [, setUserId] = useAtom(userIdAtom);
  const [, setUserGroupId] = useAtom(userGroupIdAtom);
  const t = useTranslations("UserFeedPage.FeedUser");

  // store user atoms data
  useEffect(() => {
    if (user?.role) {
      setUserRole(user?.role);
      setUserId(user?.id);
      if (user?.role === "teacher") {
        setUserGroupId(selectOptions[0]?.key as string);
      }
    }
  }, [
    setUserRole,
    user?.role,
    setUserId,
    user?.id,
    setUserGroupId,
    selectOptions,
  ]);

  const getSelectOptions = useCallback(async () => {
    if (user?.role === "admin") {
      const rawAllGroups = await getAllGroups();
      const formatedGroups = Array.isArray(rawAllGroups)
        ? rawAllGroups.map((group) => ({
            key: group?.id,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatedGroups);
    } else if (user?.role === "teacher") {
      const rawUserGroups = await getUserGroups(user?.id);
      const formatedGroups = Array.isArray(rawUserGroups)
        ? rawUserGroups.map((group) => ({
            key: group?.id,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatedGroups);
    } else {
      const rawUserChildren: UserChildren[] | unknown = await getUserChildren();
      const formatedChildren = Array.isArray(rawUserChildren)
        ? rawUserChildren.map((child) => ({
            key: child?.children?.child_group[0]?.group_id,
            label: `${child?.children?.first_name} ${child?.children?.last_name}`,
          }))
        : [];
      setSelectOptions(formatedChildren);
    }
  }, [user, setSelectOptions]);

  useEffect(() => {
    getSelectOptions();
  }, [getSelectOptions]);

  useEffect(() => {
    if (selectOptions.length > 0 && !groupContextValue) {
      // TODO: check if there is selectedValue in LocalStorage
      const initialValue = new Set([selectOptions[0].key]);
      setGroupContextValue(initialValue);
    }
  }, [selectOptions, setGroupContextValue, groupContextValue]);

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
          selectedKeys={groupContextValue}
          onSelectionChange={setGroupContextValue}
          isDisabled={user.role === "teacher"}
        >
          {(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
        </Select>
      </div>
    </div>
  );
}
