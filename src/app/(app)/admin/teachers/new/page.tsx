"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { TeacherForm, TeacherFormRef } from "@/components/admin/teachers/TeacherForm";
import NavigationBar from "@/components/common/NavigationBar";
import useCreateTeacherMutation from "@/hooks/UseCreateTeacherMutation";
import useUpdateTeacherMutation from "@/hooks/UseUpdateTeacherMutation";
import { AvatarValidationError, uploadTeacherAvatar } from "@/utils/uploadTeacherAvatar";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddTeacherPage() {
  const t = useTranslations("AdminTeachers");
  const router = useRouter();
  const formRef = useRef<TeacherFormRef>(null);
  const { mutate: createTeacher, isPending } = useCreateTeacherMutation();
  const { mutate: updateTeacher } = useUpdateTeacherMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    createTeacher(
      {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        document_type: values.document_type,
        document_number: values.document_number,
        role: "teacher",
        phone: values.phone || null,
        groupIds: values.groupIds,
      },
      {
        onSuccess: async (teacherId) => {
          // Upload avatar after creation (we need the real profile id for the storage path)
          // then persist the path back to profiles.avatar_url
          if (values.avatarFile instanceof File) {
            setIsUploading(true);
            try {
              const avatarPath = await uploadTeacherAvatar(teacherId, values.avatarFile);
              updateTeacher({
                id: teacherId,
                first_name: values.first_name,
                last_name: values.last_name,
                document_type: values.document_type,
                document_number: values.document_number,
                role: "teacher",
                phone: values.phone || null,
                groupIds: values.groupIds,
                avatar_url: avatarPath,
              });
            } catch (err) {
              if (err instanceof AvatarValidationError) {
                addToast({ title: err.message, color: "warning" });
              }
              // Non-fatal: teacher was created, avatar is just missing
            }
            setIsUploading(false);
          }
          addToast({ title: t("toasts.createSuccess"), color: "success" });
          router.push(`/admin/teachers/${teacherId}`);
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
      <NavigationBar backRoute="/admin/teachers" pageTitle={t("form.newTitle")} />
      <div className="px-1 pb-20 md:pb-0">
        <TeacherForm ref={formRef} mode="create" onSubmit={() => {}} />
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />
    </section>
  );
}
