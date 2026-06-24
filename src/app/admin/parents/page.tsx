"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ParentsList } from "@/components/admin/parents/ParentsList";
import { ParentsSearchBar } from "@/components/admin/parents/ParentsSearchBar";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminParentsPage() {
  const t = useTranslations("AdminParents.list");
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin" pageTitle={t("title")} />
      <div className="flex flex-col gap-3 overflow-auto">
        <ParentsSearchBar onSearch={setSearch} />
        <ParentsList search={search} />
      </div>
      <AdminActionButton
        variant="add"
        onPress={() => router.push("/admin/parents/new")}
      />
    </section>
  );
}
