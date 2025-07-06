import { sendMessage } from "@/queries/messages/send-messages";
import { Database } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import { useMutation } from "@tanstack/react-query";

function useSendMessage () {
  const client = createClient();
  const mutationFn = async (message: Database["public"]["Tables"]["messages"]["Insert"]) => {
    return await sendMessage(client, message)
      .then(result => result.data);
  }
  return useMutation({ mutationFn });
}


export default useSendMessage;