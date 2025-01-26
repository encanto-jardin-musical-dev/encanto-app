"use client";

import { getAllGroups, getUserChildren, getUserGroups } from "@/queries/user";
import { Database } from "@/types/database.types";
import { Avatar, Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  userCurrentSelectionAtom,
  userRoleAtom,
  userSelectOptionsAtom,
} from "@/lib/store/user";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

type FeedUserProps = {
  loggedUser: UserProfile;
};

type UserChildren = {
  relationship: string;
  children: {
    id: string;
    first_name: string;
    last_name: string;
  };
};

export default function FeedUser({ loggedUser }: FeedUserProps) {
  const [selectOptions, setSelectOptions] = useAtom(userSelectOptionsAtom);
  const [selectValue, setSelectValue] = useAtom(userCurrentSelectionAtom);
  const [, setUserRole] = useAtom(userRoleAtom);
  const t = useTranslations("UserFeedPage.FeedUser");

  useEffect(() => {
    if (loggedUser?.role) {
      setUserRole(loggedUser?.role);
    }
  }, [setUserRole, loggedUser?.role]);

  const getSelectOptions = useCallback(async () => {
    if (loggedUser?.role === "admin") {
      const rawAllGroups = await getAllGroups();
      const formatedGroups = Array.isArray(rawAllGroups)
        ? rawAllGroups.map((group) => ({
            key: group?.id,
            label: group?.name,
          }))
        : [];
      setSelectOptions(formatedGroups);
    } else if (loggedUser?.role === "teacher") {
      const rawUserGroups = await getUserGroups(loggedUser?.id);
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
            key: child?.children?.id,
            label: `${child?.children?.first_name} ${child?.children?.last_name}`,
          }))
        : [];
      setSelectOptions(formatedChildren);
    }
  }, [loggedUser, setSelectOptions]);

  useEffect(() => {
    getSelectOptions();
  }, [getSelectOptions]);

  useEffect(() => {
    if (selectOptions.length > 0) {
      setSelectValue(new Set([selectOptions[0].key]));
    }
  }, [selectOptions, setSelectValue]);

  const getSelectPlaceholder = () => {
    if (loggedUser?.role === "admin" || loggedUser?.role === "teacher") {
      return t("placeholders.other", { count: selectOptions.length });
    }
    return t("placeholders.parent", { count: selectOptions.length });
  };

  const getSelectLabel = () => {
    if (loggedUser?.role === "admin" || loggedUser?.role === "teacher") {
      return t("labels.other", { count: selectOptions.length });
    }
    return t("labels.parent", { count: selectOptions.length });
  };

  return (
    <>
      <h1>
        {t("greeting", {
          name: `${loggedUser?.first_name} ${loggedUser?.last_name}`,
        })}
      </h1>
      <div className="flex w-full gap-4 pt-4">
        <div>
          <Avatar size="lg" name={loggedUser?.first_name} color="primary" />
        </div>
        <Select
          label={getSelectLabel()}
          items={selectOptions}
          placeholder={getSelectPlaceholder()}
          selectedKeys={selectValue}
          onSelectionChange={setSelectValue}
        >
          {(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
        </Select>
      </div>
    </>
  );
}
