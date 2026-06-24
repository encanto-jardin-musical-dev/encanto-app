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
      <div className="flex flex-col gap-3 overflow-auto">
        <TeachersSearchBar onSearch={setSearch} />
        <TeachersList search={search} />
      </div>
      <AdminActionButton
        variant="add"
        onPress={() => router.push("/admin/teachers/new")}
      />
    </section>
  );
}
