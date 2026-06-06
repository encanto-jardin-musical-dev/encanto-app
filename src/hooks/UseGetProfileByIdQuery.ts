import { getProfileById } from '@/queries/users/get-profile-by-id';
import type { ProfileByIdResult } from '@/queries/users/get-profile-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type ProfileById = ProfileByIdResult;

type UseGetProfileByIdQueryOptions = {
  initialData?: ProfileById;
};

export function useGetProfileByIdQuery(
  id: string | undefined,
  options: UseGetProfileByIdQueryOptions = {}
) {
  const client = createClient();

  return useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => getProfileById(client, id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    initialData: options.initialData,
    retry: false,
  });
}

export default useGetProfileByIdQuery;
