import { describe, expect, it, vi } from 'vitest';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

const getProfilesByRole = vi.fn();

vi.mock('@/queries/shared/get-profiles-by-role', () => ({
  getProfilesByRole: (...args: unknown[]) => getProfilesByRole(...args),
}));

const { getAvailableTeachers } = await import('./get-available-teachers');

describe('getAvailableTeachers', () => {
  it('delegates to getProfilesByRole for the teacher role', async () => {
    const teachers = [{ id: 't1', first_name: 'Grace', last_name: 'Hopper' }];
    getProfilesByRole.mockResolvedValueOnce(teachers);
    const client = {} as unknown as TypedSupabaseClient;

    const result = await getAvailableTeachers(client);

    expect(getProfilesByRole).toHaveBeenCalledWith(client, 'teacher');
    expect(result).toEqual(teachers);
  });

  it('propagates errors from getProfilesByRole', async () => {
    getProfilesByRole.mockRejectedValueOnce(new Error('Failed to fetch profiles: boom'));

    await expect(getAvailableTeachers({} as unknown as TypedSupabaseClient)).rejects.toThrow(
      'Failed to fetch profiles: boom'
    );
  });
});
