"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import ConfirmDeleteGroupModal from "@/components/admin/groups/ConfirmDeleteGroupModal";
import { GroupForm, GroupFormRef, GroupFormValues } from "@/components/admin/groups/GroupForm";
import NavigationBar from "@/components/common/NavigationBar";
import useDeleteGroupMutation from "@/hooks/UseDeleteGroupMutation";
import useGroupByIdQuery from "@/hooks/UseGroupByIdQuery";
import useUpdateGroupMutation from "@/hooks/UseUpdateGroupMutation";
import { ImageValidationError, uploadGroupImage } from "@/utils/uploadGroupImage";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function EditGroupPage() {
  const t = useTranslations("AdminGroups");
  const router = useRouter();
  const { groupID } = useParams<{ groupID: string }>();
  const formRef = useRef<GroupFormRef>(null);
  const { data: group } = useGroupByIdQuery(groupID);
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroupMutation();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroupMutation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    // Determine the image_url to persist:
    // - new File  → upload and use new URL
    // - null      → explicit removal, set to null
    // - undefined → no change, keep existing
    let image_url: string | null | undefined = undefined;

    if (values.imageFile instanceof File) {
      setIsUploading(true);
      try {
        image_url = await uploadGroupImage(groupID, values.imageFile);
      } catch (err) {
        setIsUploading(false);
        if (err instanceof ImageValidationError) {
          addToast({ title: err.message, color: "danger" });
        } else {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        }
        return;
      }
      setIsUploading(false);
    } else if (values.imageFile === null) {
      image_url = null; // explicit removal
    }
    // else undefined → omit from update (keep existing)

    updateGroup(
      {
        id: groupID,
        name: values.name,
        teacher_id: values.teacher_id,
        ...(image_url !== undefined ? { image_url } : {}),
      },
      {
        onSuccess: () => {
          addToast({ title: t("toasts.updateSuccess"), color: "success" });
          router.push(`/admin/groups/${groupID}`);
        },
        onError: () => {
          addToast({ title: t("toasts.updateError"), color: "danger" });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteGroup(groupID, {
      onSuccess: () => {
        addToast({ title: t("toasts.deleteSuccess"), color: "success" });
        router.push("/admin/groups");
      },
      onError: () => {
        addToast({ title: t("toasts.deleteError"), color: "danger" });
      },
    });
  };

  const groupName = group?.name ?? "";

  const defaultValues: (Partial<GroupFormValues> & { existingImageUrl?: string | null }) | undefined = group
    ? {
        name: group.name,
        teacher_id: group.teacher?.id ?? null,
        existingImageUrl: group.image_url,
      }
    : undefined;

  const isBusy = isUpdating || isUploading;

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar
        backRoute={`/admin/groups/${groupID}`}
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
              isDisabled={!group || isDeleting}
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      <div className="px-1 pb-20">
        {defaultValues ? (
          <GroupForm ref={formRef} defaultValues={defaultValues} onSubmit={() => {}} />
        ) : (
          <p className="text-center text-default-400 py-8">…</p>
        )}
      </div>
      <AdminActionButton variant="save" namespace="AdminGroups" onPress={handleSave} isLoading={isBusy} />

      <ConfirmDeleteGroupModal
        groupName={groupName}
        isOpen={isOpen}
        isPending={isDeleting}
        onOpenChange={onOpenChange}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
