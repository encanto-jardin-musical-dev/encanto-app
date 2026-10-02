import { getFeedUserMessages } from '@/queries/feed/get-feed-user-messages';
import { QueryParams } from '@/types/hooks.types';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useGetUserFeedMessages(queryParams: QueryParams) {
  const client = createClient();
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  // Keyed by user *and* group: the query filters on `group_id`, so a shared key
  // would serve the previous group's rows from cache while the switch refetches.
  const userID = params.userID ?? '';
  const groupID = params.groupID ?? '';
  const queryKey = ['user-feed-messages', userID, groupID];

  const queryFn = async () => {
    return getFeedUserMessages(client, { userID, groupID }).then(
      result => result.data
    );
  };

  return useQuery({ queryKey, queryFn, ...options });
}

export default useGetUserFeedMessages;
