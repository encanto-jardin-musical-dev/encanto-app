import { getFeedUserMessages } from '@/queries/feed/get-feed-user-messages';
import { QueryParams } from '@/types/hooks.types';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useGetUserFeedMessages(queryParams: QueryParams) {
  const client = createClient();
  const queryKey = ['user-feed-messages'];
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  const queryFn = async () => {
    const userID = params.userID!;
    const groupID = params.groupID!;
    return getFeedUserMessages(client, { userID, groupID }).then(
      result => result.data
    );
  };

  return useQuery({ queryKey, queryFn, ...options });
}

export default useGetUserFeedMessages;
