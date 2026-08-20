"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { TeacherDetail } from "@/components/admin/teachers/TeacherDetail";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function TeacherDetailPage() {
  const t = useTranslations("AdminTeachers");
  const router = useRouter();
  const { teacherID } = useParams<{ teacherID: string }>();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/teachers" pageTitle={t("list.title")} />
      <div className="overflow-auto pb-20 md:pb-0">
        <TeacherDetail teacherID={teacherID} />
      </div>
      <AdminActionButton
        variant="edit"
        onPress={() => router.push(`/admin/teachers/${teacherID}/edit`)}
      />
    </section>
  );
}
