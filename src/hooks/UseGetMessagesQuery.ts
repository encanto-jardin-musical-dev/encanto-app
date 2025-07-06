import { getMessages } from "@/queries/messages/get-messages";
import { QueryParams } from "@/types/hooks.types";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function UseGetMessagesQuery(queryParams: QueryParams) {
  const client = createClient();
  const queryKey = ["get-messages"];
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  const queryFn = async () => {
    return await getMessages(client, params.userID!)
      .then(result => result.data);
  }
  return useQuery({ queryKey, queryFn, ...options });
}

export default UseGetMessagesQuery;
