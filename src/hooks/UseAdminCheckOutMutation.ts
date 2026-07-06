"use client";
import { clockOutChildren } from '@/queries/attendance/clock-out-children';
import { createClient } from '@/utils/supabase/client';
import { todayDateString } from '@/utils/dates';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminCheckOutMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => clockOutChildren(client, [childId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-overview', todayDateString()] });
    },
  });
}