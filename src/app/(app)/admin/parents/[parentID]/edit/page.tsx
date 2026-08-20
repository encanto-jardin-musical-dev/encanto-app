"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import ConfirmDeleteParentModal from "@/components/admin/parents/ConfirmDeleteParentModal";
import { ParentForm, ParentFormRef, ParentFormValues } from "@/components/admin/parents/ParentForm";
import NavigationBar from "@/components/common/NavigationBar";
import useParentByIdQuery from "@/hooks/UseParentByIdQuery";
import useDeleteParentMutation from "@/hooks/UseDeleteParentMutation";
import useUpdateParentMutation from "@/hooks/UseUpdateParentMutation";
import { AvatarValidationError, uploadParentAvatar } from "@/utils/uploadParentAvatar";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function EditParentPage() {
  const t = useTranslations("AdminParents");
  const router = useRouter();
  const { parentID } = useParams<{ parentID: string }>();
  const formRef = useRef<ParentFormRef>(null);
  const { data: parent } = useParentByIdQuery(parentID);
  const { mutate: updateParent, isPending: isUpdating } = useUpdateParentMutation();
  const { mutate: deleteParent, isPending: isDeleting } = useDeleteParentMutation();
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
        avatar_url = await uploadParentAvatar(parentID, values.avatarFile);
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

    updateParent(
      {
        id: parentID,
        first_name: values.first_name,
        last_name: values.last_name,
        document_type: values.document_type,
        document_number: values.document_number,
        role: "parent",
        phone: values.phone || null,
        children: values.children,
        ...(avatar_url !== undefined ? { avatar_url } : {}),
      },
      {
        onSuccess: () => {
          addToast({ title: t("toasts.updateSuccess"), color: "success" });
          router.push(`/admin/parents/${parentID}`);
        },
        onError: () => {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteParent(parentID, {
      onSuccess: () => {
        addToast({ title: t("toasts.deleteSuccess"), color: "success" });
        router.push("/admin/parents");
      },
      onError: () => {
        addToast({ title: t("toasts.deleteError"), color: "danger" });
      },
    });
  };

  const parentName = parent
    ? `${parent.first_name} ${parent.last_name}`
    : "";

  const defaultValues:
    | (Partial<ParentFormValues> & { existingAvatarUrl?: string | null })
    | undefined = parent
    ? {
        first_name: parent.first_name,
        last_name: parent.last_name,
        document_type: parent.document_type,
        document_number: parent.document_number,
        phone: parent.phone ?? "",
        children: parent.children.map((c) => ({
          child_id: c.id,
          relationship: c.relationship,
        })),
        existingAvatarUrl: parent.avatar_url,
      }
    : undefined;

  const isBusy = isUpdating || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar
        backRoute={`/admin/parents/${parentID}`}
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
              isDisabled={!parent || isDeleting}
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      <div className="px-1 pb-20 md:pb-0">
        {defaultValues ? (
          <ParentForm ref={formRef} mode="edit" defaultValues={defaultValues} onSubmit={() => {}} />
        ) : (
          <p className="text-center text-default-400 py-8">…</p>
        )}
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />

      <ConfirmDeleteParentModal
        parentName={parentName}
        isOpen={isOpen}
        isPending={isDeleting}
        onOpenChange={onOpenChange}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
