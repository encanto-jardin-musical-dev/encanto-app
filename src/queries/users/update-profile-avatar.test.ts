import { describe, expect, it } from 'vitest';
import { updateProfileAvatar } from './update-profile-avatar';
import { createSupabaseClientMock } from '@/test/mocks/supabase';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

describe('updateProfileAvatar', () => {
  it('updates the avatar_url for the given user', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: null },
    });

    await updateProfileAvatar(client as unknown as TypedSupabaseClient, 'user-1', 'avatars/user-1.png');

    const builder = client.from.mock.results[0].value;
    expect(builder.update).toHaveBeenCalledWith({ avatar_url: 'avatars/user-1.png' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('supports passing null to remove the avatar', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: null },
    });

    await updateProfileAvatar(client as unknown as TypedSupabaseClient, 'user-1', null);

    const builder = client.from.mock.results[0].value;
    expect(builder.update).toHaveBeenCalledWith({ avatar_url: null });
  });

  it('throws when the update errors', async () => {
    const client = createSupabaseClientMock({
      profiles: { data: null, error: { message: 'connection lost' } },
    });

    await expect(
      updateProfileAvatar(client as unknown as TypedSupabaseClient, 'user-1', 'avatars/user-1.png')
    ).rejects.toThrow('Failed to update avatar: connection lost');
  });
});
