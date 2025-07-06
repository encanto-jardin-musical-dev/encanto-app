import { getAllGroups } from "@/queries/users/get-all-groups";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUserAllGroupsQuery(queryOptions = {}) {
  const client = createClient();
  const queryKey = ["user-all-groups"];

  const queryFn = async () => {
    return getAllGroups(client).then((result) => result.data);
  }

  return useQuery({ queryKey, queryFn, ...queryOptions })
}

export default useUserAllGroupsQuery;
