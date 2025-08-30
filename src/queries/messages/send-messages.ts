import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function sendMessage(
  client: TypedSupabaseClient,
  message: Database['public']['Tables']['messages']['Insert']
) {
  const { content, sender_id, receiver_id, group_id } = message;
  const messageToSend = {
    content,
    sender_id,
    receiver_id: receiver_id || null,
    group_id: group_id || null,
  };
  return await client
    .from('messages')
    .insert([messageToSend])
    .select()
    .single();
}
