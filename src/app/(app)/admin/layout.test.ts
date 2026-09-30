import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import AdminLayout from './layout';

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects an unverified authenticated user to the feed', async () => {
    const maybeSingle = vi.fn();
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'admin-user', email_confirmed_at: null },
          },
          error: null,
        }),
      },
      from,
    });

    await expect(AdminLayout({ children: null })).rejects.toThrow(
      'NEXT_REDIRECT:/feed'
    );

    expect(redirectMock).toHaveBeenCalledWith('/feed');
    expect(from).not.toHaveBeenCalled();
  });
});
