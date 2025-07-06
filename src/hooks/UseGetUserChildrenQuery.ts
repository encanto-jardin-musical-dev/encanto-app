import { getUserChildren } from "@/queries/users/get-user-children";
import { QueryParams } from "@/types/hooks.types";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUserChildrenQuery(queryParams: QueryParams = {}) {
  const client = createClient();
  const queryKey = ["user-children"];
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  const queryFn = async () => {
    return getUserChildren(client, params?.userID && params?.userID, params?.groupID && params?.groupID)
      .then((result) => result.data);
  }

  return useQuery({ queryKey, queryFn, ...options });
}

export default useUserChildrenQuery;
