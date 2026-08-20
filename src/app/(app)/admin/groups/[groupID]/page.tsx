"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { GroupDetail } from "@/components/admin/groups/GroupDetail";
import NavigationBar from "@/components/common/NavigationBar";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function GroupDetailPage() {
  const t = useTranslations("AdminGroups");
  const router = useRouter();
  const { groupID } = useParams<{ groupID: string }>();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/groups" pageTitle={t("list.title")} />
      <div className="overflow-auto pb-20 md:pb-0">
        <GroupDetail groupID={groupID} />
      </div>
      <AdminActionButton
        variant="edit"
        namespace="AdminGroups"
        onPress={() => router.push(`/admin/groups/${groupID}/edit`)}
      />
    </section>
  );
}
