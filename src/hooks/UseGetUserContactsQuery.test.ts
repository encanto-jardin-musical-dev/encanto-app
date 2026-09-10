import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper } from '@/test/utils/queryClientWrapper';

const getParentUserContacts = vi.fn();
const getUserContacts = vi.fn();
const createSignedUrls = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ storage: { from: () => ({ createSignedUrls }) } }),
}));
vi.mock('@/queries/messages/get-parent-user-contacts', () => ({
  getParentUserContacts: (...args: unknown[]) => getParentUserContacts(...args),
}));
vi.mock('@/queries/messages/get-user-contacts', () => ({
  getUserContacts: (...args: unknown[]) => getUserContacts(...args),
}));

const { default: useUserContactsQuery } = await import('./UseGetUserContactsQuery');

describe('useUserContactsQuery', () => {
  it('uses the parent RPC contacts path for a parent user', async () => {
    getParentUserContacts.mockResolvedValueOnce({
      data: [{ id: 'c1', first_name: 'Ada', last_name: 'Lovelace', role: 'teacher', avatar_url: null }],
      error: null,
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserContactsQuery({ params: { userID: 'user-1', userRole: 'parent', childFilter: 'child-1' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getParentUserContacts).toHaveBeenCalledWith(expect.anything(), 'child-1');
    expect(getUserContacts).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([
      { id: 'c1', first_name: 'Ada', last_name: 'Lovelace', role: 'teacher', avatar_url: null },
    ]);
  });

  it('uses the direct profiles query path with a role filter for non-parent users', async () => {
    getUserContacts.mockResolvedValueOnce({ data: [], error: null });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserContactsQuery({ params: { userID: 'user-1', userRole: 'teacher', roleFilter: 'admin' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUserContacts).toHaveBeenCalledWith(expect.anything(), 'user-1', 'admin');
  });

  it('resolves avatar signed urls grouped by role bucket', async () => {
    getUserContacts.mockResolvedValueOnce({
      data: [{ id: 'c1', first_name: 'Ada', last_name: 'Lovelace', role: 'teacher', avatar_url: 'path/a.png' }],
      error: null,
    });
    createSignedUrls.mockResolvedValueOnce({
      data: [{ path: 'path/a.png', signedUrl: 'https://signed/a.png', error: null }],
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserContactsQuery({ params: { userID: 'user-1', userRole: 'teacher' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].avatar_url).toBe('https://signed/a.png');
  });

  it('propagates a rejected query as an error', async () => {
    getUserContacts.mockRejectedValueOnce(new Error('network down'));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useUserContactsQuery({ params: { userID: 'user-1', userRole: 'teacher' } }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('network down'));
  });
});
