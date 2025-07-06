"use client";

import { Avatar, Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  userRoleAtom,
  userSelectOptionsAtom,
  userIdAtom,
} from "@/lib/store/user";
import { groupContextSelectedAtom } from "@/lib/store/common";
import type { UserProfile } from "@/types/auth.types";
import type { Key } from "@react-types/shared";
import useUserChildrenQuery from "@/hooks/UseGetUserChildrenQuery";
import useUserGroupsQuery from "@/hooks/UseGetUserGroupsQuery";
import useUserAllGroupsQuery from "@/hooks/UseGetAllGroupsQuery";
import { USER_ROLES } from "@/lib/const";

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
  const t = useTranslations("UserFeedPage.FeedUser");

  useEffect(() => {
    if (id) setUserId(id);
    if (role) setUserRole(role);

  }, [id, role, setUserId, setUserRole]);

  const { data: userChildren } = useUserChildrenQuery({ params: {}, options: { enabled: user?.role === USER_ROLES.PARENT } });
  const { data: userGroups } = useUserGroupsQuery(user?.id, { enabled: user?.role === USER_ROLES.TEACHER });
  const { data: allGroups } = useUserAllGroupsQuery({ enabled: user?.role === USER_ROLES.ADMIN });

  const getSelectOptions = useCallback(async () => {
    if (user?.role === USER_ROLES.ADMIN) {
      const formatedGroups = Array.isArray(allGroups)
        ? allGroups.map((group) => ({
          key: group?.id as Key,
          label: group?.name,
        }))
        : [];
      setSelectOptions(formatedGroups);
    } else if (user?.role === USER_ROLES.TEACHER) {
      const formatedGroups = Array.isArray(userGroups)
        ? userGroups.map((group) => ({
          key: group?.id as Key,
          label: group?.name,
        }))
        : [];
      setSelectOptions(formatedGroups);
    } else {
      const formatedChildren = Array.isArray(userChildren)
        ? userChildren.map((child) => ({
          key: child?.children?.child_groups[0]?.group_id as Key,
          label: `${child?.children?.first_name} ${child?.children?.last_name}`,
        }))
        : [];
      setSelectOptions(formatedChildren);
    }
  },
    [user?.role, allGroups, setSelectOptions, userGroups, userChildren]
  );

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
    if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEACHER) {
      return t("placeholders.other", { count: selectOptions.length });
    }
    return t("placeholders.parent", { count: selectOptions.length });
  };

  const getSelectLabel = () => {
    if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEACHER) {
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
          isDisabled={user.role === USER_ROLES.TEACHER}
        >
          {(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
        </Select>
      </div>
    </div>
  );
}
