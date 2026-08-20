"use client";
import { runCleanupPreview } from '@/queries/admin/run-cleanup';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

export function useCleanupPreviewMutation() {
  const client = createClient();

  return useMutation({
    mutationFn: () => runCleanupPreview(client),
  });
}
