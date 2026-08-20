"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { GroupForm, GroupFormRef } from "@/components/admin/groups/GroupForm";
import NavigationBar from "@/components/common/NavigationBar";
import useCreateGroupMutation from "@/hooks/UseCreateGroupMutation";
import { ImageValidationError, uploadGroupImage } from "@/utils/uploadGroupImage";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddGroupPage() {
  const t = useTranslations("AdminGroups");
  const router = useRouter();
  const formRef = useRef<GroupFormRef>(null);
  const { mutate: createGroup, isPending } = useCreateGroupMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    let imageUrl: string | null = null;

    if (values.imageFile instanceof File) {
      setIsUploading(true);
      try {
        // We don't have a groupId yet — use a temp path; we'll overwrite after creation.
        const tempId = `tmp-${Date.now()}`;
        imageUrl = await uploadGroupImage(tempId, values.imageFile);
      } catch (err) {
        setIsUploading(false);
        if (err instanceof ImageValidationError) {
          addToast({ title: err.message, color: "danger" });
        } else {
          addToast({ title: t("toasts.createError"), color: "danger" });
        }
        return;
      }
      setIsUploading(false);
    }

    createGroup(
      { name: values.name, teacherIds: values.teacherIds, image_url: imageUrl },
      {
        onSuccess: (groupId) => {
          addToast({ title: t("toasts.createSuccess"), color: "success" });
          router.push(`/admin/groups/${groupId}`);
        },
        onError: () => {
          addToast({ title: t("toasts.createError"), color: "danger" });
        },
      }
    );
  };

  const isBusy = isPending || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] grid-cols-[minmax(0,1fr)] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/groups" pageTitle={t("form.newTitle")} />
      <div className="px-1 pb-20 md:pb-0 min-w-0">
        <GroupForm ref={formRef} onSubmit={() => {}} />
      </div>
      <AdminActionButton variant="save" namespace="AdminGroups" onPress={handleSave} isLoading={isBusy} />
    </section>
  );
}
