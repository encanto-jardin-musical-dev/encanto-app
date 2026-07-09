'use client';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import MessageAttachments from '@/components/messages/MessageAttachments';
import { useAttachmentUrlsQuery } from '@/hooks/UseAttachmentUrlsQuery';
import useDeleteReportMutation from '@/hooks/UseDeleteReportMutation';
import useReportByIdQuery from '@/hooks/UseReportByIdQuery';
import useUpdateReportMutation from '@/hooks/UseUpdateReportMutation';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { Attachment } from '@/types/messages.types';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  addToast,
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Skeleton,
} from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { ReportForm, ReportFormRef } from './ReportForm';

type ReportDetailProps = {
  reportId: string;
};

export function ReportDetail({ reportId }: ReportDetailProps) {
  const t = useTranslations('ReportsPage');
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const isStaff = user.role === USER_ROLES.TEACHER || user.role === USER_ROLES.ADMIN;

  const { data: report, isPending, isSuccess } = useReportByIdQuery(reportId);
  const { mutate: updateReport, isPending: isUpdating } = useUpdateReportMutation();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReportMutation();

  const [isEditing, setIsEditing] = useState(() => isStaff && searchParams.get('edit') === '1');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // Suppresses the notFound() check below once deletion succeeds — the
  // invalidated detail query would otherwise refetch to null and throw
  // before router.push('/reports') finishes navigating away.
  const [isDeleted, setIsDeleted] = useState(false);
  const formRef = useRef<ReportFormRef>(null);

  const attachments: Attachment[] = Array.isArray(report?.attachments)
    ? (report.attachments as unknown as Attachment[])
    : [];

  const { signedUrlMap, isLoading: isSigningUrls, isError: isSigningError } = useAttachmentUrlsQuery({
    requests: attachments.map((attachment) => ({ messageId: reportId, attachment })),
    enabled: attachments.length > 0,
  });

  if (isSuccess && !report && !isDeleted) {
    notFound();
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-6 w-2/3 rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  if (!report) return null;

  const handleSave = () => {
    const valid = formRef.current?.submit();
    if (!valid) return;
    const values = formRef.current?.getValues();
    if (!values) return;

    updateReport(
      {
        reportId: report.id,
        title: values.title,
        groupId: values.groupId,
        childId: values.childId,
        description: values.description || null,
        attachments: values.attachments,
      },
      {
        onSuccess: () => {
          addToast({ title: t('toasts.updateSuccess'), color: 'success' });
          setIsEditing(false);
          router.replace(`/reports/${values.groupId}/${report.id}`);
        },
        onError: () => {
          addToast({ title: t('toasts.updateError'), color: 'danger' });
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteReport(report.id, {
      onSuccess: () => {
        setIsDeleted(true);
        addToast({ title: t('toasts.deleteSuccess'), color: 'success' });
        router.push('/reports');
      },
      onError: () => {
        addToast({ title: t('toasts.deleteError'), color: 'danger' });
      },
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4 pb-20">
        <ReportForm
          ref={formRef}
          defaultValues={{
            title: report.title,
            groupId: report.group_id ?? '',
            childId: report.child_id,
            description: report.description,
            attachments,
            reportDate: report.report_date,
          }}
        />
        <AdminActionButton variant="save" namespace="ReportsPage" onPress={handleSave} isLoading={isUpdating} />
      </div>
    );
  }

  const authorName = report.profiles
    ? `${report.profiles.first_name} ${report.profiles.last_name}`.trim()
    : t('detail.unknownAuthor');
  const createdDate = report.created_at ? new Date(report.created_at) : null;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {attachments.length > 0 && (
        <MessageAttachments
          attachments={attachments}
          signedUrls={signedUrlMap}
          isLoading={isSigningUrls}
          isError={isSigningError}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar size="sm" name={authorName} color="primary" />
          <div className="flex flex-col">
            <span className="text-small font-medium text-foreground">{authorName}</span>
            {createdDate && (
              <span className="text-tiny text-default-500">{format.relativeTime(createdDate, now)}</span>
            )}
          </div>
        </div>
        {isStaff && (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" aria-label={t('actions.edit')}>
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t('actions.edit')}
              onAction={(key) => {
                if (key === 'edit') setIsEditing(true);
                if (key === 'delete') setIsDeleteOpen(true);
              }}
            >
              <DropdownItem key="edit">{t('actions.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger">
                {t('actions.delete')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground">{report.title}</h2>
        {report.description && (
          <p className="text-default-700 whitespace-pre-wrap mt-1">{report.description}</p>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        isPending={isDeleting}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        labels={{
          title: t('deleteModal.title'),
          message: t('deleteModal.message', { title: report.title }),
          cancel: t('deleteModal.cancel'),
          confirm: t('deleteModal.confirm'),
        }}
      />
    </div>
  );
}
