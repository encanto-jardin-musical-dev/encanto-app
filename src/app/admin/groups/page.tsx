"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { GroupsList } from "@/components/admin/groups/GroupsList";
import { GroupsSearchBar } from "@/components/admin/groups/GroupsSearchBar";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminGroupsPage() {
  const t = useTranslations("AdminGroups.list");
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin" pageTitle={t("title")} />
      <div className="flex flex-col gap-3 overflow-auto">
        <GroupsSearchBar onSearch={setSearch} />
        <GroupsList search={search} />
      </div>
      <AdminActionButton
        variant="add"
        namespace="AdminGroups"
        onPress={() => router.push("/admin/groups/new")}
      />
    </section>
  );
}
