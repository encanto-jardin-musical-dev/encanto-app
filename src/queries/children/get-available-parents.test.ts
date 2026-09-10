import { describe, expect, it, vi } from 'vitest';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const getProfilesByRole = vi.fn();

vi.mock('@/queries/shared/get-profiles-by-role', () => ({
  getProfilesByRole: (...args: unknown[]) => getProfilesByRole(...args),
}));

const { getAvailableParents } = await import('./get-available-parents');

describe('getAvailableParents', () => {
  it('delegates to getProfilesByRole for the parent role with avatars', async () => {
    const parents = [{ id: 'p1', first_name: 'Ada', last_name: 'Lovelace', avatar_url: null }];
    getProfilesByRole.mockResolvedValueOnce(parents);
    const client = {} as unknown as TypedSupabaseClient;

    const result = await getAvailableParents(client);

    expect(getProfilesByRole).toHaveBeenCalledWith(client, 'parent', { withAvatar: true });
    expect(result).toEqual(parents);
  });

  it('propagates errors from getProfilesByRole', async () => {
    getProfilesByRole.mockRejectedValueOnce(new Error('Failed to fetch profiles: boom'));

    await expect(getAvailableParents({} as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch profiles: boom'
    );
  });
});
