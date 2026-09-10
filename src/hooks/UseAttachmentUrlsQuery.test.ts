import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getSession = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getSession } }),
}));

const { useAttachmentUrlsQuery } = await import('./UseAttachmentUrlsQuery');

const request = {
  messageId: 'message-1',
  attachment: { key: 'messages/2024/01/a.webp', contentType: 'image/webp', size: 10, name: 'a.webp' },
};

describe('useAttachmentUrlsQuery', () => {
  beforeEach(() => {
    getSession.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    getSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it('is disabled when there are no requests', () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttachmentUrlsQuery({ requests: [] }), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('signs the requested attachments and builds a key -> url map', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        urls: [{ messageId: 'message-1', key: request.attachment.key, url: 'https://signed.example/a.webp' }],
      }),
    } as Response);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttachmentUrlsQuery({ requests: [request] }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.signedUrlMap).toEqual({
      [request.attachment.key]: 'https://signed.example/a.webp',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/sign-attachment-urls',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      })
    );
  });

  it('throws when there is no active session', async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttachmentUrlsQuery({ requests: [request] }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Not authenticated'));
  });

  it('surfaces the response error message when signing fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'forbidden' }),
    } as Response);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAttachmentUrlsQuery({ requests: [request] }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('forbidden'));
  });
});
