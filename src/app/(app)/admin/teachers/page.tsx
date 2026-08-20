"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { TeachersList } from "@/components/admin/teachers/TeachersList";
import { TeachersSearchBar } from "@/components/admin/teachers/TeachersSearchBar";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTeachersPage() {
  const t = useTranslations("AdminTeachers.list");
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin" pageTitle={t("title")} />
      <div className="grid grid-rows-[auto_1fr] gap-3 min-h-0 overflow-hidden">
        <TeachersSearchBar onSearch={setSearch} />
        <div className="overflow-y-auto min-h-0">
          <TeachersList search={search} />
        </div>
      </div>
      <AdminActionButton
        variant="add"
        onPress={() => router.push("/admin/teachers/new")}
      />
    </section>
  );
}
