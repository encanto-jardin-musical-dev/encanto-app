'use client';

import useAttendanceGroupsQuery from '@/hooks/UseAttendanceGroupsQuery';
import useAttendedChildrenQuery from '@/hooks/UseAttendedChildrenQuery';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { Attachment } from '@/types/messages.types';
import { todayDateString } from '@/utils/dates';
import { uploadAttachments } from '@/utils/uploadAttachment/index';
import { MAX_FILE_COUNT, validateAttachments } from '@/utils/uploadAttachment/validate';
import { DocumentIcon, PlusIcon } from '@heroicons/react/24/outline';
import { addToast, Button, Chip, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const DESCRIPTION_MAX_LENGTH = 500;
const SEND_TO_ALL_KEY = 'all';

export type ReportFormValues = {
  title: string;
  groupId: string;
  childId: string | null;
  description: string;
  attachments: Attachment[];
};

export type ReportFormRef = {
  submit: () => boolean;
  getValues: () => ReportFormValues;
};

type ReportFormDefaults = {
  title?: string;
  groupId?: string;
  childId?: string | null;
  description?: string | null;
  attachments?: Attachment[];
  /** The report's original date — used so the child selector reflects that day's attendance when editing. */
  reportDate?: string;
};

type ReportFormProps = {
  defaultValues?: ReportFormDefaults;
};

const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(({ defaultValues }, ref) => {
  const t = useTranslations('ReportsPage.form');
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const teacherId = isAdmin ? undefined : user.id;
  const { data: groups } = useAttendanceGroupsQuery(teacherId);

  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [groupId, setGroupId] = useState(defaultValues?.groupId ?? '');
  const [childId, setChildId] = useState<string>(defaultValues?.childId ?? SEND_TO_ALL_KEY);
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(defaultValues?.attachments ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'groupId', string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportDate = defaultValues?.reportDate ?? todayDateString();
  const { data: attendedChildren } = useAttendedChildrenQuery(groupId, reportDate, defaultValues?.childId);

  const handleGroupChange = (value: string) => {
    setGroupId(value);
    setChildId(SEND_TO_ALL_KEY);
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;

    const validation = validateAttachments(files, undefined, attachments.length);
    if (!validation.valid) {
      for (const err of validation.errors) {
        addToast({ title: err.message, color: 'danger' });
      }
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadAttachments(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      addToast({
        title: t('attachments.uploadErrorTitle'),
        description: t('attachments.uploadErrorDescription'),
        color: 'danger',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((att) => att.key !== key));
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      const newErrors: typeof errors = {};
      if (!title.trim()) newErrors.title = t('title.required');
      if (!groupId) newErrors.groupId = t('group.required');
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    getValues: () => ({
      title: title.trim(),
      groupId,
      childId: childId === SEND_TO_ALL_KEY ? null : childId,
      description,
      attachments,
    }),
  }));

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <Select
        label={t('group.label')}
        placeholder={t('group.placeholder')}
        selectedKeys={groupId ? new Set([groupId]) : new Set()}
        onSelectionChange={(keys) => {
          const [first] = [...keys];
          handleGroupChange(first ? String(first) : '');
        }}
        isInvalid={!!errors.groupId}
        errorMessage={errors.groupId}
        isRequired
      >
        {(groups ?? []).map((group) => (
          <SelectItem key={group.id}>{group.name}</SelectItem>
        ))}
      </Select>

      <Select
        label={t('child.label')}
        selectedKeys={new Set([childId])}
        onSelectionChange={(keys) => {
          const [first] = [...keys];
          setChildId(first ? String(first) : SEND_TO_ALL_KEY);
        }}
        isDisabled={!groupId}
      >
        {[
          <SelectItem key={SEND_TO_ALL_KEY}>{t('child.sendToAll')}</SelectItem>,
          ...(attendedChildren ?? []).map((child) => (
            <SelectItem key={child.id}>{`${child.first_name} ${child.last_name}`}</SelectItem>
          )),
        ]}
      </Select>

      <Input
        label={t('title.label')}
        placeholder={t('title.placeholder')}
        value={title}
        onValueChange={setTitle}
        isInvalid={!!errors.title}
        errorMessage={errors.title}
        isRequired
      />

      <div className="flex flex-col gap-1">
        <Textarea
          label={t('description.label')}
          placeholder={t('description.placeholder')}
          variant="bordered"
          value={description}
          onValueChange={(value) => setDescription(value.slice(0, DESCRIPTION_MAX_LENGTH))}
          minRows={3}
        />
        <span className="text-tiny text-default-400 self-end">
          {t('description.counter', { count: description.length, max: DESCRIPTION_MAX_LENGTH })}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <Chip
                key={att.key}
                onClose={() => handleRemoveAttachment(att.key)}
                variant="flat"
                startContent={<DocumentIcon className="w-3.5 h-3.5" />}
              >
                <span className="truncate max-w-[160px] text-xs">{att.name}</span>
              </Chip>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
          aria-label={t('attachments.add')}
        />
        <Button
          variant="flat"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handlePickFiles}
          isLoading={isUploading}
          isDisabled={attachments.length >= MAX_FILE_COUNT}
        >
          {t('attachments.add')}
        </Button>
      </div>
    </div>
  );
});

ReportForm.displayName = 'ReportForm';

export { ReportForm };
