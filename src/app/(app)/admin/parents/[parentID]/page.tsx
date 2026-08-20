"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ParentDetail } from "@/components/admin/parents/ParentDetail";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function ParentDetailPage() {
  const t = useTranslations("AdminParents");
  const router = useRouter();
  const { parentID } = useParams<{ parentID: string }>();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/parents" pageTitle={t("list.title")} />
      <div className="overflow-auto pb-20 md:pb-0">
        <ParentDetail parentID={parentID} />
      </div>
      <AdminActionButton
        variant="edit"
        onPress={() => router.push(`/admin/parents/${parentID}/edit`)}
      />
    </section>
  );
}
