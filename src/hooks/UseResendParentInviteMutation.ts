import { resendParentInvite, ResendParentInviteResult } from '@/queries/parents/resend-parent-invite';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

function useResendParentInviteMutation() {
  const client = createClient();

  return useMutation<ResendParentInviteResult, Error, string>({
    mutationFn: (parentId: string) => resendParentInvite(client, parentId),
    // No cache invalidation needed — this is a side-effect only action
  });
}

export default useResendParentInviteMutation;
