import { getUserProfiles } from "@/queries/users/get-user-profiles";
import { QueryParams } from "@/types/hooks.types";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function UseGetUserProfilesQuery(queryParams: QueryParams) {
  const client = createClient();
  const queryKey = ["user-profiles", queryParams.params?.userIds];
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  const queryFn = async () => {
    const userIds = params.userIds as string[];
    if (!userIds?.length) return [];
    
    return getUserProfiles(client, userIds).then(result => result.data || []);
  };

  return useQuery({ queryKey, queryFn, ...options });
}

export default UseGetUserProfilesQuery;