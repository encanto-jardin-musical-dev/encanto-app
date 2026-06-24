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
      <div className="grid grid-rows-[auto_1fr] gap-3 min-h-0 overflow-hidden">
        <ParentsSearchBar onSearch={setSearch} />
        <div className="overflow-y-auto min-h-0">
          <ParentsList search={search} />
        </div>
      </div>
      <AdminActionButton
        variant="add"
        onPress={() => router.push("/admin/parents/new")}
      />
    </section>
  );
}
