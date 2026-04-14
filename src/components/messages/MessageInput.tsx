'use client';

import useSendMessage from '@/hooks/UseSendMessageMutation';
import { useGetProfileByIdQuery } from '@/hooks/UseGetProfileByIdQuery';
import { USER_ROLES } from '@/lib/const';
import { contextGroupValue } from '@/lib/store/common';
import { userIdAtom, userRoleAtom } from '@/lib/store/user';
import { Database } from '@/types/database.types';
import type { Attachment } from '@/types/messages.types';
import { uploadAttachments, type UploadProgress } from '@/utils/uploadAttachment/index';
import { validateAttachments } from '@/utils/uploadAttachment/validate';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { addToast, Button, Chip, Progress, Textarea } from '@heroui/react';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

// 8.8 Feature flag — attachment picker is only shown when this env var is truthy
const ATTACHMENTS_ENABLED = process.env.NEXT_PUBLIC_ATTACHMENTS_ENABLED === 'true';

type MessageInputProps = {
  receiverId: string;
};

interface FileProgress {
  file: File;
  percent: number;
}

export default function MessageInput({ receiverId }: MessageInputProps) {
  const t = useTranslations('MessagesInput');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId] = useAtom(userIdAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [groupContextId] = useAtom(contextGroupValue);

  const {
    data: receiverProfile,
    isPending: isProfilePending,
    isError: isProfileError,
  } = useGetProfileByIdQuery(receiverId);
  const isReceiverMissing =
    isProfileError || (!isProfilePending && !receiverProfile);

  const { mutate: sendMessageMutation } = useSendMessage();

  // 8.3 Only show attachment picker for non-parent roles and when feature flag is on
  const showAttachmentPicker =
    ATTACHMENTS_ENABLED && userRole !== USER_ROLES.PARENT && userRole !== 'parent';

  // 8.1 Handle file picker trigger
  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files ?? []);
    if (newFiles.length === 0) return;

    const allFiles = [...selectedFiles, ...newFiles];

    // 6.1 Client-side validation
    const validation = validateAttachments(allFiles, t as Parameters<typeof validateAttachments>[1]);
    if (!validation.valid) {
      for (const err of validation.errors) {
        addToast({
          title: t('Attachments.validationErrorTitle', { defaultValue: 'Invalid file' }),
          description: err.message,
          color: 'danger',
          hideIcon: true,
        });
      }
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFiles(allFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    const hasContent = content.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    // 8.4 Allow send when either content or files are present
    if (!hasContent && !hasFiles) {
      addToast({
        title: t('emptyMessageTitle', { defaultValue: 'Mensaje vacío' }),
        description: t('emptyMessageDescription', {
          defaultValue: 'No puedes enviar un mensaje vacío.',
        }),
        color: 'warning',
        hideIcon: true,
      });
      return;
    }

    // 8.5 Wire send action: validate → upload → send
    let attachments: Attachment[] | undefined;

    if (hasFiles) {
      // Re-validate before upload
      const validation = validateAttachments(selectedFiles, t as Parameters<typeof validateAttachments>[1]);
      if (!validation.valid) {
        for (const err of validation.errors) {
          addToast({
            title: t('Attachments.validationErrorTitle', { defaultValue: 'Invalid file' }),
            description: err.message,
            color: 'danger',
            hideIcon: true,
          });
        }
        return;
      }

      // Initialize progress tracking
      setFileProgress(selectedFiles.map(f => ({ file: f, percent: 0 })));
      setIsUploading(true);

      // 8.6 Upload with per-file progress
      const onProgress = (progress: UploadProgress) => {
        setFileProgress(prev =>
          prev.map(fp =>
            fp.file === progress.file
              ? { ...fp, percent: progress.percent }
              : fp
          )
        );
      };

      try {
        attachments = await uploadAttachments(selectedFiles, onProgress);
      } catch {
        // 8.7 Show error toast on upload failure, preserve composer state
        setIsUploading(false);
        setFileProgress([]);
        addToast({
          title: t('Attachments.uploadErrorTitle', { defaultValue: 'Upload failed' }),
          description: t('Attachments.uploadErrorDescription', {
            defaultValue: 'One or more files failed to upload. Please try again.',
          }),
          color: 'danger',
          hideIcon: true,
        });
        return;
      }

      setIsUploading(false);
      setFileProgress([]);
    }

    const newMessage: Database['public']['Tables']['messages']['Insert'] = {
      content: content.trim() || '',
      sender_id: userId,
      receiver_id: receiverId,
      group_id:
        userRole === USER_ROLES.TEACHER ? (groupContextId as string) : null,
    };

    sendMessageMutation(
      { message: newMessage, attachments },
      {
        onSuccess: () => {
          setContent('');
          setSelectedFiles([]);
          setFileProgress([]);
        },
        onError: () => {
          addToast({
            title: t('sendErrorTitle', { defaultValue: 'Error al enviar' }),
            description: t('sendErrorDescription', {
              defaultValue: 'No se pudo enviar el mensaje. Intenta de nuevo.',
            }),
            color: 'danger',
            hideIcon: true,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 8.2 Selected file chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {selectedFiles.map((file, index) => {
            const progress = fileProgress.find(fp => fp.file === file);
            return (
              <div key={`${file.name}-${index}`} className="flex flex-col gap-1 max-w-[180px]">
                <Chip
                  onClose={!isUploading ? () => handleRemoveFile(index) : undefined}
                  variant="flat"
                  size="sm"
                  className="max-w-[180px]"
                >
                  <span className="truncate text-xs">
                    {file.name} ({formatBytes(file.size)})
                  </span>
                </Chip>
                {/* 8.6 Upload progress indicator */}
                {isUploading && progress !== undefined && (
                  <Progress
                    size="sm"
                    value={progress.percent}
                    className="max-w-[180px]"
                    aria-label={`Uploading ${file.name}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 justify-around items-end">
        {/* 8.1 Hidden file input */}
        {showAttachmentPicker && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
            aria-label="Select files to attach"
          />
        )}

        <Textarea
          variant="bordered"
          minRows={1}
          placeholder={t('placeholder')}
          isClearable
          value={content}
          onValueChange={setContent}
          name="messageInput"
          isDisabled={isReceiverMissing || isUploading}
        />

        {/* 8.1 Attachment picker button (teacher/admin only, feature-flagged) */}
        {showAttachmentPicker ? (
          <Button
            isIconOnly
            aria-label="add files"
            onPress={handlePickFiles}
            isDisabled={isReceiverMissing || isUploading}
            variant="flat"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        ) : userRole !== 'parent' ? (
          // Non-flagged fallback: keep button visible but inert for non-parents
          null
        ) : null}

        {/* 8.4 Send button enabled when content OR files are present */}
        <Button
          isIconOnly
          aria-label="submit message"
          color="primary"
          onPress={handleSubmit}
          isDisabled={
            (!content.trim() && selectedFiles.length === 0) ||
            isReceiverMissing ||
            isUploading
          }
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
