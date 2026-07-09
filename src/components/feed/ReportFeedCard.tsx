'use client';

import { useAttachmentUrlsQuery } from '@/hooks/UseAttachmentUrlsQuery';
import type { ReportRow } from '@/queries/reports/get-group-reports';
import type { Attachment } from '@/types/messages.types';
import { Avatar, Button } from '@heroui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type ReportFeedCardProps = {
  report: ReportRow;
};

function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export default function ReportFeedCard({ report }: ReportFeedCardProps) {
  const t = useTranslations('UserFeedPage.ReportFeedCard');
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();

  const attachments: Attachment[] = Array.isArray(report.attachments)
    ? (report.attachments as unknown as Attachment[])
    : [];
  const firstImage = attachments.find((att) => isImageType(att.contentType)) ?? null;

  const { signedUrlMap } = useAttachmentUrlsQuery({
    requests: firstImage ? [{ messageId: report.id, attachment: firstImage }] : [],
    enabled: !!firstImage,
  });

  const backgroundUrl = firstImage ? signedUrlMap[firstImage.key] : '/defaults/report-cover.jpg';
  const authorName = report.profiles
    ? `${report.profiles.first_name} ${report.profiles.last_name}`.trim()
    : '';
  const childName = report.child_id && report.children
    ? `${report.children.first_name} ${report.children.last_name}`.trim()
    : null;
  const createdDate = new Date(report.created_at as string);

  const handleSeeMore = () => {
    router.push(`/reports/${report.group_id}/${report.id}`);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-default-100 shrink-0">
      <div
        className={`relative h-40 w-full flex items-end p-3 ${
          backgroundUrl ? '' : 'bg-gradient-to-br from-primary-200 to-primary-400'
        }`}
        style={
          backgroundUrl
            ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative flex items-center gap-2">
          <Avatar size="sm" name={authorName} color="primary" />
          <div className="flex flex-col">
            <span className="text-small font-medium text-white">{authorName}</span>
            <span className="text-tiny text-white/80">{format.relativeTime(createdDate, now)}</span>
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-medium font-semibold text-foreground">{report.title}</h3>
          {childName && (
            <span className="text-tiny text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">
              {t('individualFor', { name: childName })}
            </span>
          )}
        </div>
        {report.description && (
          <p className="text-small text-default-700 line-clamp-2">{report.description}</p>
        )}
        <Button size="sm" variant="light" color="primary" className="self-end" onPress={handleSeeMore}>
          {t('seeMore')}
        </Button>
      </div>
    </div>
  );
}
