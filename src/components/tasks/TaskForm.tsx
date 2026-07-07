'use client';

import useAttendanceGroupsQuery from '@/hooks/UseAttendanceGroupsQuery';
import { USER_ROLES } from '@/lib/const';
import { userAtom } from '@/lib/store/user';
import type { Attachment } from '@/types/messages.types';
import { uploadAttachments } from '@/utils/uploadAttachment/index';
import { MAX_FILE_COUNT, validateAttachments } from '@/utils/uploadAttachment/validate';
import { DocumentIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  addToast,
  Button,
  Chip,
  DatePicker,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { parseDate, type DateValue } from '@internationalized/date';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const DESCRIPTION_MAX_LENGTH = 500;

export type TaskFormValues = {
  title: string;
  groupId: string;
  dueDate: string | null;
  description: string;
  attachments: Attachment[];
};

export type TaskFormRef = {
  submit: () => boolean;
  getValues: () => TaskFormValues;
};

type TaskFormDefaults = {
  title?: string;
  groupId?: string;
  dueDate?: string | null;
  description?: string | null;
  attachments?: Attachment[];
};

type TaskFormProps = {
  defaultValues?: TaskFormDefaults;
};

const TaskForm = forwardRef<TaskFormRef, TaskFormProps>(({ defaultValues }, ref) => {
  const t = useTranslations('TasksPage.form');
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const teacherId = isAdmin ? undefined : user.id;
  const { data: groups } = useAttendanceGroupsQuery(teacherId);

  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [groupId, setGroupId] = useState(defaultValues?.groupId ?? '');
  const [dueDate, setDueDate] = useState<string | null>(defaultValues?.dueDate ?? null);
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(defaultValues?.attachments ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'groupId', string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dueDateValue = dueDate ? parseDate(dueDate) : null;

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
      if (!groupId) newErrors.groupId = t('title.required');
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    getValues: () => ({ title: title.trim(), groupId, dueDate, description, attachments }),
  }));

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <Input
        label={t('title.label')}
        placeholder={t('title.placeholder')}
        value={title}
        onValueChange={setTitle}
        isInvalid={!!errors.title}
        errorMessage={errors.title}
        isRequired
      />

      <Select
        label={t('group.label')}
        placeholder={t('group.placeholder')}
        selectedKeys={groupId ? new Set([groupId]) : new Set()}
        onSelectionChange={(keys) => {
          const [first] = [...keys];
          setGroupId(first ? String(first) : '');
        }}
        isInvalid={!!errors.groupId}
        errorMessage={errors.groupId}
        isRequired
      >
        {(groups ?? []).map((group) => (
          <SelectItem key={group.id}>{group.name}</SelectItem>
        ))}
      </Select>

      <DatePicker
        label={t('dueDate.label')}
        value={dueDateValue}
        onChange={(value: DateValue | null) => setDueDate(value ? value.toString() : null)}
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

TaskForm.displayName = 'TaskForm';

export { TaskForm };
