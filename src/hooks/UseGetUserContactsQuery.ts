import { USER_ROLES } from "@/lib/const";
import { getParentUserContacts } from "@/queries/messages/get-parent-user-contacts";
import { getUserContacts } from "@/queries/messages/get-user-contacts";
import { QueryParams } from "@/types/hooks.types";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUserContactsQuery(queryParams: QueryParams) {
  const client = createClient();
  const queryKey = ["user-contacts"];
  const params = queryParams.params || {};
  const options = queryParams.options || {};

  const queryFn = async () => {
    if (params?.userRole === USER_ROLES.PARENT) {
      return getParentUserContacts(client).then(result => result.data);
    }
    return getUserContacts(client, params.userID!)
      .then(result => result.data);
  }

  return useQuery({ queryKey, queryFn, ...options });
}

export default useUserContactsQuery;
