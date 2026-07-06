"use client";
import { getAdminAttendanceOverview } from '@/queries/attendance/get-admin-attendance-overview';
import { createClient } from '@/utils/supabase/client';
import { todayDateString } from '@/utils/dates';
import { useQuery } from '@tanstack/react-query';

export function useAdminAttendanceOverviewQuery() {
  const client = createClient();
  const today = todayDateString();

  return useQuery({
    queryKey: ['admin-attendance-overview', today],
    queryFn: () => getAdminAttendanceOverview(client),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}