"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ChildDetail } from "@/components/admin/children/ChildDetail";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function ChildDetailPage() {
  const t = useTranslations("AdminChildren");
  const router = useRouter();
  const { childID } = useParams<{ childID: string }>();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/children" pageTitle={t("list.title")} />
      <div className="overflow-auto pb-20 md:pb-0">
        <ChildDetail childID={childID} />
      </div>
      <AdminActionButton
        variant="edit"
        onPress={() => router.push(`/admin/children/${childID}/edit`)}
      />
    </section>
  );
}
