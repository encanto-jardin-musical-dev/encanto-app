"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ChildForm, ChildFormRef } from "@/components/admin/children/ChildForm";
import NavigationBar from "@/components/common/NavigationBar";
import useCreateChildMutation from "@/hooks/UseCreateChildMutation";
import { AvatarValidationError, uploadChildAvatar } from "@/utils/uploadChildAvatar";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddChildPage() {
  const t = useTranslations("AdminChildren");
  const router = useRouter();
  const formRef = useRef<ChildFormRef>(null);
  const { mutate: createChild, isPending } = useCreateChildMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    let avatarUrl: string | null = null;

    if (values.avatarFile instanceof File) {
      setIsUploading(true);
      try {
        // We don't have a childId yet — use a temp path; we'll overwrite after creation.
        // Use a timestamp-based temp key; the actual file will be re-keyed on the child id.
        const tempId = `tmp-${Date.now()}`;
        avatarUrl = await uploadChildAvatar(tempId, values.avatarFile);
      } catch (err) {
        setIsUploading(false);
        if (err instanceof AvatarValidationError) {
          addToast({ title: err.message, color: "danger" });
        } else {
          addToast({ title: t("toasts.createError"), color: "danger" });
        }
        return;
      }
      setIsUploading(false);
    }

    const { avatarFile, ...childValues } = values;

    createChild(
      { ...childValues, avatar_url: avatarUrl },
      {
        onSuccess: (childId) => {
          addToast({ title: t("toasts.createSuccess"), color: "success" });
          router.push(`/admin/children/${childId}`);
        },
        onError: () => {
          addToast({ title: t("toasts.createError"), color: "danger" });
        },
      }
    );
  };

  const isBusy = isPending || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/children" pageTitle={t("form.newTitle")} />
      <div className="px-1 pb-20">
        <ChildForm ref={formRef} onSubmit={() => {}} />
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />
    </section>
  );
}
