"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import ConfirmDeleteChildModal from "@/components/admin/children/ConfirmDeleteChildModal";
import { ChildForm, ChildFormRef, ChildFormValues } from "@/components/admin/children/ChildForm";
import NavigationBar from "@/components/common/NavigationBar";
import useChildByIdQuery from "@/hooks/UseChildByIdQuery";
import useDeleteChildMutation from "@/hooks/UseDeleteChildMutation";
import useUpdateChildMutation from "@/hooks/UseUpdateChildMutation";
import { AvatarValidationError, uploadChildAvatar } from "@/utils/uploadChildAvatar";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function EditChildPage() {
  const t = useTranslations("AdminChildren");
  const router = useRouter();
  const { childID } = useParams<{ childID: string }>();
  const formRef = useRef<ChildFormRef>(null);
  const { data: child } = useChildByIdQuery(childID);
  const { mutate: updateChild, isPending: isUpdating } = useUpdateChildMutation();
  const { mutate: deleteChild, isPending: isDeleting } = useDeleteChildMutation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    // Determine the avatar_url to persist:
    // - new File  → upload and use new URL
    // - null      → explicit removal, set to null
    // - undefined → no change, keep existing
    let avatar_url: string | null | undefined = undefined;

    if (values.avatarFile instanceof File) {
      setIsUploading(true);
      try {
        avatar_url = await uploadChildAvatar(childID, values.avatarFile);
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

    const { avatarFile, ...childValues } = values;

    updateChild(
      {
        id: childID,
        ...childValues,
        ...(avatar_url !== undefined ? { avatar_url } : {}),
      },
      {
        onSuccess: () => {
          addToast({ title: t("toasts.updateSuccess"), color: "success" });
          router.push(`/admin/children/${childID}`);
        },
        onError: () => {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteChild(childID, {
      onSuccess: () => {
        addToast({ title: t("toasts.deleteSuccess"), color: "success" });
        router.push("/admin/children");
      },
      onError: () => {
        addToast({ title: t("toasts.deleteError"), color: "danger" });
      },
    });
  };

  const childName = child
    ? `${child.first_name} ${child.last_name}`
    : "";

  const defaultValues: (Partial<ChildFormValues> & { existingAvatarUrl?: string | null }) | undefined = child
    ? {
        first_name: child.first_name,
        last_name: child.last_name,
        document_type: child.document_type,
        document_number: child.document_number,
        gender: child.gender,
        birth_date: child.birth_date,
        address: child.address ?? "",
        groupIds: child.groups.map((g) => g.id),
        guardians: child.guardians.map((g) => ({
          guardian_id: g.id,
          relationship: g.relationship,
        })),
        existingAvatarUrl: child.avatar_url,
      }
    : undefined;

  const isBusy = isUpdating || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar
        backRoute={`/admin/children/${childID}`}
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
              isDisabled={!child || isDeleting}
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      <div className="px-1 pb-20">
        {defaultValues ? (
          <ChildForm ref={formRef} defaultValues={defaultValues} onSubmit={() => {}} />
        ) : (
          <p className="text-center text-default-400 py-8">…</p>
        )}
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isBusy} />

      <ConfirmDeleteChildModal
        childName={childName}
        isOpen={isOpen}
        isPending={isDeleting}
        onOpenChange={onOpenChange}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
