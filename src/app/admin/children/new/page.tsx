"use client";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ChildForm, ChildFormRef } from "@/components/admin/children/ChildForm";
import NavigationBar from "@/components/common/NavigationBar";
import useCreateChildMutation from "@/hooks/UseCreateChildMutation";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function AddChildPage() {
  const t = useTranslations("AdminChildren");
  const router = useRouter();
  const formRef = useRef<ChildFormRef>(null);
  const { mutate: createChild, isPending } = useCreateChildMutation();

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    createChild(values, {
      onSuccess: (childId) => {
        addToast({ title: t("toasts.createSuccess"), color: "success" });
        router.push(`/admin/children/${childId}`);
      },
      onError: () => {
        addToast({ title: t("toasts.createError"), color: "danger" });
      },
    });
  };

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/admin/children" pageTitle={t("form.newTitle")} />
      <div className="overflow-auto pb-20">
        <ChildForm ref={formRef} onSubmit={() => {}} />
      </div>
      <AdminActionButton variant="save" onPress={handleSave} isLoading={isPending} />
    </section>
  );
}
