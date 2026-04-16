import { sendMessage } from '@/queries/messages/send-messages';
import { Database } from '@/types/database.types';
import type { MessageAttachments } from '@/types/messages.types';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface SendMessageParams {
  message: Database['public']['Tables']['messages']['Insert'];
  attachments?: MessageAttachments;
}

function useSendMessage() {
  const client = createClient();
  const mutationFn = async ({ message, attachments }: SendMessageParams) => {
    return await sendMessage(client, message, attachments).then(result => result);
  };
  return useMutation({ mutationFn });
}

export default useSendMessage;
