import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import type { Attachment } from '@/types/messages.types';

type ReportInsert = Database['public']['Tables']['daily_reports']['Insert'];

export type CreateReportParams = {
  title: string;
  groupId: string;
  teacherId: string;
  childId?: string | null;
  description?: string | null;
  attachments?: Attachment[];
};

export async function createReport(
  client: TypedSupabaseClient,
  { title, groupId, teacherId, childId, description, attachments }: CreateReportParams
): Promise<void> {
  const payload: ReportInsert = {
    title,
    group_id: groupId,
    teacher_id: teacherId,
    child_id: childId ?? null,
    description: description ?? null,
    attachments: attachments?.length ? (attachments as unknown as ReportInsert['attachments']) : null,
  };

  const { error } = await client.from('daily_reports').insert(payload);

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }
}
