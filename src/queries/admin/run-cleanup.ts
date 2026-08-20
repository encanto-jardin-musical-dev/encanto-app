import { TypedSupabaseClient } from '@/utils/supabase/client';
import type {
  CleanupExecuteResponse,
  CleanupPreviewResponse,
  CleanupRequest,
} from '@/types/admin.types';

/** Extract a useful message from a FunctionsHttpError JSON body when present. */
async function resolveFunctionError(error: { message: string; context?: Response }): Promise<string> {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error as string;
  } catch {
    // Fall through to the generic message below.
  }
  return error.message;
}

/**
 * Invokes the admin-data-cleanup edge function in preview mode.
 * Counts rows and attachment objects older than the server-computed cutoff;
 * deletes nothing.
 */
export async function runCleanupPreview(
  client: TypedSupabaseClient
): Promise<CleanupPreviewResponse> {
  const body: CleanupRequest = { mode: 'preview' };
  const { data, error } = await client.functions.invoke<CleanupPreviewResponse>(
    'admin-data-cleanup',
    { body }
  );

  if (error) {
    throw new Error(`Cleanup preview failed: ${await resolveFunctionError(error)}`);
  }

  if (!data?.cutoff || !data?.entities) {
    throw new Error('Cleanup preview failed: unexpected response shape');
  }

  return data;
}

/**
 * Invokes the admin-data-cleanup edge function in execute mode.
 * Requires the exact cutoff returned by a prior preview plus the typed
 * confirmation phrase; deletes rows older than the cutoff and their S3
 * attachment objects.
 */
export async function runCleanupExecute(
  client: TypedSupabaseClient,
  cutoff: string,
  confirmationPhrase: string
): Promise<CleanupExecuteResponse> {
  const body: CleanupRequest = { mode: 'execute', cutoff, confirmationPhrase };
  const { data, error } = await client.functions.invoke<CleanupExecuteResponse>(
    'admin-data-cleanup',
    { body }
  );

  if (error) {
    throw new Error(`Cleanup execute failed: ${await resolveFunctionError(error)}`);
  }

  if (!data?.entities) {
    throw new Error('Cleanup execute failed: unexpected response shape');
  }

  return data;
}
