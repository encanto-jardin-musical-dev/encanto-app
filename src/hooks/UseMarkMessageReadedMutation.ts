import { markMessagesAsRead } from "@/queries/messages/mark-messages-as-read";
import { createClient } from "@/utils/supabase/client"
import { useMutation } from "@tanstack/react-query";

function useMarkMessageRead() {
  const client = createClient();
  const mutationFn = async (messageId: string) => {
    return await markMessagesAsRead(client, messageId)
      .then(result => result.data);
  }
  return useMutation({ mutationFn });

}

export default useMarkMessageRead
