import { getFeedUserMessages } from "@/queries/feed/get-feed-user-messages";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useGetUserFeedMessages(userID: string, groupID: string, enable: boolean) {
  const client = createClient();
  const queryKey = ["user-feed-messages"];

  const queryFn = async () => {
    return getFeedUserMessages(client, { userID, groupID }).then(result => result.data)
  }

  return useQuery({ queryKey, queryFn, enabled: enable });
}

export default useGetUserFeedMessages;
