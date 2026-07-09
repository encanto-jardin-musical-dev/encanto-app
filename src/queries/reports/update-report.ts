import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import type { Attachment } from '@/types/messages.types';

type ReportUpdate = Database['public']['Tables']['daily_reports']['Update'];

export type UpdateReportParams = {
  reportId: string;
  title: string;
  groupId: string;
  childId?: string | null;
  description?: string | null;
  attachments?: Attachment[];
};

export async function updateReport(
  client: TypedSupabaseClient,
  { reportId, title, groupId, childId, description, attachments }: UpdateReportParams
): Promise<void> {
  const payload: ReportUpdate = {
    title,
    group_id: groupId,
    child_id: childId ?? null,
    description: description ?? null,
    attachments: attachments?.length ? (attachments as unknown as ReportUpdate['attachments']) : null,
  };

  const { error } = await client.from('daily_reports').update(payload).eq('id', reportId);

  if (error) {
    throw new Error(`Failed to update report: ${error.message}`);
  }
}
