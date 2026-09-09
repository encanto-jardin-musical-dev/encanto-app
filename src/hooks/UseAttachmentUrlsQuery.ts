'use client';

// Fetches signed GET URLs for message attachments from the sign-attachment-urls
// edge function, which verifies participant access and signs Supabase Storage
// URLs (private `message-attachments` bucket). Caches results with a staleTime
// of ~23 hours to stay within the 24-hour signed-URL TTL.

import type { Attachment } from '@/types/messages.types';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

// 23 hours in milliseconds — stays safely under the 24-hour signed URL TTL
const STALE_TIME_MS = 23 * 60 * 60 * 1000;

interface AttachmentRequest {
  messageId: string;
  key: string;
}

export interface SignedAttachmentUrl {
  messageId: string;
  key: string;
  url: string | null;
  error?: string;
}

/**
 * Maps attachment key → signed URL for quick lookup in rendering.
 */
export type SignedUrlMap = Record<string, string>;

interface UseAttachmentUrlsQueryParams {
  /** Array of { messageId, attachment } pairs to sign in one batch call. */
  requests: { messageId: string; attachment: Attachment }[];
  enabled?: boolean;
}

async function fetchSignedUrls(
  requests: AttachmentRequest[]
): Promise<SignedAttachmentUrl[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) throw new Error('Not authenticated');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  const response = await fetch(`${supabaseUrl}/functions/v1/sign-attachment-urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ attachments: requests }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? `Failed to sign attachment URLs: ${response.status}`);
  }

  const data = await response.json();
  return data.urls as SignedAttachmentUrl[];
}

/**
 * Fetches signed GET URLs for a batch of message attachments.
 * Results are cached for ~23 hours (staleTime) to avoid re-signing within the 24h TTL window.
 *
 * Returns a `signedUrlMap` keyed by attachment `key` for O(1) lookup in rendering.
 */
export function useAttachmentUrlsQuery({
  requests,
  enabled = true,
}: UseAttachmentUrlsQueryParams) {
  const queryRequests: AttachmentRequest[] = requests.map(({ messageId, attachment }) => ({
    messageId,
    key: attachment.key,
  }));

  const queryKey = [
    'attachment-urls',
    ...queryRequests.map(r => `${r.messageId}:${r.key}`).sort(),
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSignedUrls(queryRequests),
    enabled: enabled && queryRequests.length > 0,
    staleTime: STALE_TIME_MS,
    gcTime: STALE_TIME_MS,
  });

  const signedUrlMap: SignedUrlMap = {};
  if (query.data) {
    for (const entry of query.data) {
      if (entry.url) {
        signedUrlMap[entry.key] = entry.url;
      }
    }
  }

  return {
    ...query,
    signedUrlMap,
  };
}
