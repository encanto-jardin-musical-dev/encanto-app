"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import ConfirmDeleteTeacherModal from "@/components/admin/teachers/ConfirmDeleteTeacherModal";
import { TeacherForm, TeacherFormRef, TeacherFormValues } from "@/components/admin/teachers/TeacherForm";
import NavigationBar from "@/components/common/NavigationBar";
import useTeacherByIdQuery from "@/hooks/UseTeacherByIdQuery";
import useDeleteTeacherMutation from "@/hooks/UseDeleteTeacherMutation";
import useUpdateTeacherMutation from "@/hooks/UseUpdateTeacherMutation";
import { AvatarValidationError, uploadTeacherAvatar } from "@/utils/uploadTeacherAvatar";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function EditTeacherPage() {
  const t = useTranslations("AdminTeachers");
  const router = useRouter();
  const { teacherID } = useParams<{ teacherID: string }>();
  const formRef = useRef<TeacherFormRef>(null);
  const { data: teacher } = useTeacherByIdQuery(teacherID);
  const { mutate: updateTeacher, isPending: isUpdating } = useUpdateTeacherMutation();
  const { mutate: deleteTeacher, isPending: isDeleting } = useDeleteTeacherMutation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    // Determine the avatar_url to persist:
    // - new File  → upload and use new path
    // - null      → explicit removal, set to null
    // - undefined → no change, keep existing
    let avatar_url: string | null | undefined = undefined;

    if (values.avatarFile instanceof File) {
      setIsUploading(true);
      try {
        avatar_url = await uploadTeacherAvatar(teacherID, values.avatarFile);
      } catch (err) {
        setIsUploading(false);
        if (err instanceof AvatarValidationError) {
          addToast({ title: err.message, color: "danger" });
        } else {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        }
        return;
      }
      setIsUploading(false);
    } else if (values.avatarFile === null) {
      avatar_url = null; // explicit removal
    }
    // else undefined → omit from update (keep existing)

    updateTeacher(
      {
        id: teacherID,
        first_name: values.first_name,
        last_name: values.last_name,
        document_type: values.document_type,
        document_number: values.document_number,
        role: values.role,
        phone: values.phone || null,
        groupIds: values.groupIds,
        ...(avatar_url !== undefined ? { avatar_url } : {}),
      },
      {
        onSuccess: () => {
          addToast({ title: t("toasts.updateSuccess"), color: "success" });
          router.push(`/admin/teachers/${teacherID}`);
        },
        onError: () => {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteTeacher(teacherID, {
      onSuccess: () => {
        addToast({ title: t("toasts.deleteSuccess"), color: "success" });
        router.push("/admin/teachers");
      },
      onError: () => {
        addToast({ title: t("toasts.deleteError"), color: "danger" });
      },
    });
  };

  const teacherName = teacher
    ? `${teacher.first_name} ${teacher.last_name}`
    : "";

  const defaultValues:
    | (Partial<TeacherFormValues> & { existingAvatarUrl?: string | null })
    | undefined = teacher
    ? {
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        document_type: teacher.document_type,
        document_number: teacher.document_number,
        role: teacher.role,
        phone: teacher.phone ?? "",
        groupIds: teacher.groups.map((g) => g.id),
        existingAvatarUrl: teacher.avatar_url,
      }
    : undefined;

  const isBusy = isUpdating || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar
        backRoute={`/admin/teachers/${teacherID}`}
        pageTitle={t("form.editTitle")}
        rightElement={
          <div className="flex justify-end">
            <Button
              isIconOnly
              variant="light"
              color="danger"
              size="sm"
              aria-label={t("actions.delete")}
              onPress={onOpen}
              isDisabled={!teacher || isDeleting}
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      <div className="px-1 pb-20">
        {defaultValues ? (
          <TeacherForm ref={formRef} mode="edit" defaultValues={defaultValues} onSubmit={() => {}} />
        ) : (
          <p className="text-center text-default-400 py-8">…</p>
        )}
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />

      <ConfirmDeleteTeacherModal
        teacherName={teacherName}
        isOpen={isOpen}
        isPending={isDeleting}
        onOpenChange={onOpenChange}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
