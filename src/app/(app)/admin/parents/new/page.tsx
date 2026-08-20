"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ParentForm, ParentFormRef } from "@/components/admin/parents/ParentForm";
import NavigationBar from "@/components/common/NavigationBar";
import useCreateParentMutation from "@/hooks/UseCreateParentMutation";
import useUpdateParentMutation from "@/hooks/UseUpdateParentMutation";
import { AvatarValidationError, uploadParentAvatar } from "@/utils/uploadParentAvatar";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddParentPage() {
  const t = useTranslations("AdminParents");
  const router = useRouter();
  const formRef = useRef<ParentFormRef>(null);
  const { mutate: createParent, isPending } = useCreateParentMutation();
  const { mutate: updateParent } = useUpdateParentMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    createParent(
      {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        document_type: values.document_type,
        document_number: values.document_number,
        role: "parent",
        phone: values.phone || null,
        children: values.children,
      },
      {
        onSuccess: async (parentId) => {
          // Upload avatar after creation (we need the real profile id for the storage path)
          // then persist the path back to profiles.avatar_url
          if (values.avatarFile instanceof File) {
            setIsUploading(true);
            try {
              const avatarPath = await uploadParentAvatar(parentId, values.avatarFile);
              updateParent({
                id: parentId,
                first_name: values.first_name,
                last_name: values.last_name,
                document_type: values.document_type,
                document_number: values.document_number,
                role: "parent",
                phone: values.phone || null,
                children: values.children,
                avatar_url: avatarPath,
              });
            } catch (err) {
              if (err instanceof AvatarValidationError) {
                addToast({ title: err.message, color: "warning" });
              }
              // Non-fatal: parent was created, avatar is just missing
            }
            setIsUploading(false);
          }
          addToast({ title: t("toasts.createSuccess"), color: "success" });
          router.push(`/admin/parents/${parentId}`);
        },
        onError: (err) => {
          const isDuplicate = err?.message?.includes("EMAIL_ALREADY_REGISTERED");
          addToast({
            title: isDuplicate
              ? t("toasts.createErrorDuplicate")
              : t("toasts.createError"),
            color: "danger",
          });
        },
      }
    );
  };

  const isBusy = isPending || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/parents" pageTitle={t("form.newTitle")} />
      <div className="px-1 pb-20 md:pb-0">
        <ParentForm ref={formRef} mode="create" onSubmit={() => {}} />
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />
    </section>
  );
}
