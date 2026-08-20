"use client";
import { runCleanupExecute } from '@/queries/admin/run-cleanup';
import { createClient } from '@/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';

type CleanupExecuteVariables = {
  cutoff: string;
  confirmationPhrase: string;
};

export function useCleanupExecuteMutation() {
  const client = createClient();

  return useMutation({
    mutationFn: ({ cutoff, confirmationPhrase }: CleanupExecuteVariables) =>
      runCleanupExecute(client, cutoff, confirmationPhrase),
  });
}
