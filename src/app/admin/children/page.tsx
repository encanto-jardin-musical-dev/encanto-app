"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ChildrenList } from "@/components/admin/children/ChildrenList";
import { ChildrenSearchBar } from "@/components/admin/children/ChildrenSearchBar";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminChildrenPage() {
  const t = useTranslations("AdminChildren.list");
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin" pageTitle={t("title")} />
      <div className="flex flex-col gap-3 overflow-auto">
        <ChildrenSearchBar onSearch={setSearch} />
        <ChildrenList search={search} />
      </div>
      <AdminActionButton
        variant="add"
        onPress={() => router.push("/admin/children/new")}
      />
    </section>
  );
}
