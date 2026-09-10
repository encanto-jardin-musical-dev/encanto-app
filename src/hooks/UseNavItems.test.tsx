import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { userRoleAtom } from '@/lib/store/user';

const useFeatureFlagEnabled = vi.fn();

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: (flag: string) => useFeatureFlagEnabled(flag),
}));

const { useNavItems, useStaffActionItems } = await import('./UseNavItems');

function renderWithRole(role: 'parent' | 'teacher' | 'admin') {
  const store = createStore();
  store.set(userRoleAtom, role);

  function wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return wrapper;
}

describe('useNavItems', () => {
  it('returns only feed and messages for a parent, regardless of flags', () => {
    useFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useNavItems(), { wrapper: renderWithRole('parent') });

    expect(result.current.map((item) => item.key)).toEqual(['feed', 'messages']);
  });

  it('includes staff actions gated by flag for a teacher, excluding admin-only items', () => {
    useFeatureFlagEnabled.mockImplementation(
      (flag: string) => flag === 'admin_options_attendance'
    );

    const { result } = renderHook(() => useNavItems(), { wrapper: renderWithRole('teacher') });

    expect(result.current.map((item) => item.key)).toEqual(['feed', 'attendance', 'messages']);
  });

  it('includes the admin-only item for an admin with all flags enabled', () => {
    useFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useNavItems(), { wrapper: renderWithRole('admin') });

    expect(result.current.map((item) => item.key)).toEqual([
      'feed',
      'attendance',
      'daily-report',
      'tasks',
      'messages',
      'admin-options',
    ]);
  });

  it('treats an undefined (still loading) flag as off', () => {
    useFeatureFlagEnabled.mockReturnValue(undefined);

    const { result } = renderHook(() => useNavItems(), { wrapper: renderWithRole('teacher') });

    expect(result.current.map((item) => item.key)).toEqual(['feed', 'messages']);
  });
});

describe('useStaffActionItems', () => {
  it('reports isStaff: false for a parent, though actions filter only by flag/adminOnly', () => {
    useFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useStaffActionItems(), {
      wrapper: renderWithRole('parent'),
    });

    expect(result.current.isStaff).toBe(false);
    // filterNavItems only gates on flags and adminOnly, not on isStaff, so a
    // parent with every flag enabled still gets the flag-gated items back.
    expect(result.current.actions.map((item) => item.key)).toEqual([
      'attendance',
      'daily-report',
      'tasks',
      'messages',
    ]);
  });

  it('reports isStaff: true and all gated actions for an admin', () => {
    useFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useStaffActionItems(), {
      wrapper: renderWithRole('admin'),
    });

    expect(result.current.isStaff).toBe(true);
    expect(result.current.actions.map((item) => item.key)).toEqual([
      'attendance',
      'daily-report',
      'tasks',
      'messages',
      'admin-options',
    ]);
  });
});
