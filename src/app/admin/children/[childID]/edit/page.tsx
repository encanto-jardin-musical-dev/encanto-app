"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import ConfirmDeleteChildModal from "@/components/admin/children/ConfirmDeleteChildModal";
import { ChildForm, ChildFormRef, ChildFormValues, LinkedParent } from "@/components/admin/children/ChildForm";
import NavigationBar from "@/components/common/NavigationBar";
import useChildByIdQuery from "@/hooks/UseChildByIdQuery";
import useDeleteChildMutation from "@/hooks/UseDeleteChildMutation";
import useUpdateChildMutation from "@/hooks/UseUpdateChildMutation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useRef } from "react";

export default function EditChildPage() {
  const t = useTranslations("AdminChildren");
  const router = useRouter();
  const { childID } = useParams<{ childID: string }>();
  const formRef = useRef<ChildFormRef>(null);
  const { data: child } = useChildByIdQuery(childID);
  const { mutate: updateChild, isPending: isUpdating } = useUpdateChildMutation();
  const { mutate: deleteChild, isPending: isDeleting } = useDeleteChildMutation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    updateChild(
      { id: childID, ...values },
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

  const defaultValues: Partial<ChildFormValues> | undefined = child
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
      }
    : undefined;

  const linkedParents: LinkedParent[] | undefined = child
    ? child.guardians.map((g) => ({
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        relationship: g.relationship,
      }))
    : undefined;

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
      <div className="overflow-auto pb-20">
        {defaultValues ? (
          <ChildForm ref={formRef} defaultValues={defaultValues} onSubmit={() => {}} linkedParents={linkedParents} />
        ) : (
          <p className="text-center text-default-400 py-8">…</p>
        )}
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isUpdating} />

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
