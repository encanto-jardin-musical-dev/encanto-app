import { sendMessage } from '@/queries/messages/send-messages';
import { Database } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

function useSendMessage() {
  const client = createClient();
  const mutationFn = async (
    newMessage: Database['public']['Tables']['messages']['Insert']
  ) => {
    return await sendMessage(client, newMessage).then(result => result);
  };
  return useMutation({ mutationFn });
}

export default useSendMessage;
