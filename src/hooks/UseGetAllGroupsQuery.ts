import { getAllGroups } from "@/queries/users/get-all-groups";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUserAllGroupsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const client = createClient();
  const queryKey = ["user-all-groups"];

  const queryFn = async () => {
    return getAllGroups(client).then((result) => result.data);
  }

  return useQuery({ queryKey, queryFn, enabled })
}

export default useUserAllGroupsQuery;
