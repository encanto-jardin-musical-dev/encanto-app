import { getUserGroups } from "@/queries/users/get-user-groups";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUserGroupsQuery(userID: string, { enabled = true }: { enabled?: boolean } = {}) {
  const client = createClient();
  const queryKey = ["user-groups"];

  const queryFn = async () => {
    return getUserGroups(client, userID)
      .then((result) => result.data);
  }

  return useQuery({ queryKey, queryFn, enabled });
}

export default useUserGroupsQuery;
