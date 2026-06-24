"use client";
import useTeacherByIdQuery from "@/hooks/UseTeacherByIdQuery";
import useResendTeacherInviteMutation from "@/hooks/UseResendTeacherInviteMutation";
import { IdentificationIcon, PhoneIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { addToast, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { TeacherGroupsSection } from "./TeacherGroupsSection";

type TeacherDetailProps = {
  teacherID: string;
};

export function TeacherDetail({ teacherID }: TeacherDetailProps) {
  const tForm = useTranslations("AdminTeachers.form");
  const tDetail = useTranslations("AdminTeachers.detail");
  const tToasts = useTranslations("AdminTeachers.toasts");
  const { data: teacher, isLoading } = useTeacherByIdQuery(teacherID);
  const { mutate: resendInvite, isPending: isResending } = useResendTeacherInviteMutation();

  const handleResendInvite = () => {
    resendInvite(teacherID, {
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

  if (!teacher) {
    return <p className="text-center text-default-500 py-8">—</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identity header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center shrink-0 overflow-hidden">
          {teacher.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teacher.avatar_url}
              alt={`${teacher.first_name} ${teacher.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-default-400" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-small text-default-500">
            {tForm(`role.${teacher.role}`)}
          </span>
          <h2 className="text-xl font-bold">
            {teacher.first_name} {teacher.last_name}
          </h2>
          {(teacher.document_type || teacher.document_number) && (
            <span className="text-small text-default-500 flex items-center gap-1">
              <IdentificationIcon className="w-3.5 h-3.5 shrink-0" />
              {teacher.document_type && tForm(`idTypeAbbr.${teacher.document_type}`)}
              {teacher.document_type && teacher.document_number && " · "}
              {teacher.document_number}
            </span>
          )}
          {teacher.phone && (
            <span className="text-small text-default-500 flex items-center gap-1">
              <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
              {teacher.phone}
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

      {/* Groups */}
      <TeacherGroupsSection groups={teacher.groups} />
    </div>
  );
}
