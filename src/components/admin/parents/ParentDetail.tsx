"use client";
import useParentByIdQuery from "@/hooks/UseParentByIdQuery";
import useResendParentInviteMutation from "@/hooks/UseResendParentInviteMutation";
import { IdentificationIcon, PhoneIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { addToast, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { ParentChildrenSection } from "./ParentChildrenSection";

type ParentDetailProps = {
  parentID: string;
};

export function ParentDetail({ parentID }: ParentDetailProps) {
  const tForm = useTranslations("AdminParents.form");
  const tDetail = useTranslations("AdminParents.detail");
  const tToasts = useTranslations("AdminParents.toasts");
  const { data: parent, isLoading } = useParentByIdQuery(parentID);
  const { mutate: resendInvite, isPending: isResending } = useResendParentInviteMutation();

  const handleResendInvite = () => {
    resendInvite(parentID, {
      onSuccess: (result) => {
        if (result.status === "sent") {
          addToast({ title: tToasts("resendInviteSuccess"), color: "success" });
        } else {
          addToast({ title: tToasts("resendInviteAlreadyActive"), color: "default" });
        }
      },
      onError: () => {
        addToast({ title: tToasts("resendInviteError"), color: "danger" });
      },
    });
  };

  if (isLoading) {
    return <p className="text-center text-default-400 py-8">…</p>;
  }

  if (!parent) {
    return <p className="text-center text-default-500 py-8">—</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identity header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center shrink-0 overflow-hidden">
          {parent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={parent.avatar_url}
              alt={`${parent.first_name} ${parent.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-default-400" />
          )}
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">
            {parent.first_name} {parent.last_name}
          </h2>
          {(parent.document_type || parent.document_number) && (
            <span className="text-small text-default-500 flex items-center gap-1">
              <IdentificationIcon className="w-3.5 h-3.5 shrink-0" />
              {parent.document_type && tForm(`idTypeAbbr.${parent.document_type}`)}
              {parent.document_type && parent.document_number && " · "}
              {parent.document_number}
            </span>
          )}
          {parent.phone && (
            <span className="text-small text-default-500 flex items-center gap-1">
              <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
              {parent.phone}
            </span>
          )}
        </div>
      </div>

      {/* Resend invitation action */}
      <Button
        variant="flat"
        size="sm"
        onPress={handleResendInvite}
        isLoading={isResending}
        className="self-start"
      >
        {tDetail("resendInvitation")}
      </Button>

      {/* Children */}
      <ParentChildrenSection linkedChildren={parent.children} />
    </div>
  );
}
