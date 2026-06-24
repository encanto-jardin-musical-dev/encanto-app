import { resendTeacherInvite, ResendTeacherInviteResult } from '@/queries/teachers/resend-teacher-invite';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

function useResendTeacherInviteMutation() {
  const client = createClient();

  return useMutation<ResendTeacherInviteResult, Error, string>({
    mutationFn: (teacherId: string) => resendTeacherInvite(client, teacherId),
    // No cache invalidation needed — this is a side-effect only action
  });
}

export default useResendTeacherInviteMutation;
