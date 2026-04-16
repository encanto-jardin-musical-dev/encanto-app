import { Database } from '@/types/database.types';
import type { MessageAttachments } from '@/types/messages.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function sendMessage(
  client: TypedSupabaseClient,
  message: Database['public']['Tables']['messages']['Insert'],
  attachments?: MessageAttachments
) {
  const { content, sender_id, receiver_id, group_id } = message;
  const messageToSend = {
    content,
    sender_id,
    receiver_id: receiver_id || null,
    group_id: group_id || null,
    attachments: attachments && attachments.length > 0 ? attachments : null,
  };
  return await client
    .from('messages')
    .insert([messageToSend])
    .select()
    .single();
}
