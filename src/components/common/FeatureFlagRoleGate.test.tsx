import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { userIdAtom, userRoleAtom } from '@/lib/store/user';
import { FeatureFlagRoleGate } from './FeatureFlagRoleGate';

const useFeatureFlagEnabled = vi.fn();
const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: () => useFeatureFlagEnabled(),
}));
vi.mock('next/navigation', () => ({
  notFound: () => notFound(),
}));

function renderGated(userId: string, role: 'parent' | 'teacher' | 'admin') {
  const store = createStore();
  store.set(userIdAtom, userId);
  store.set(userRoleAtom, role);

  return render(
    <Provider store={store}>
      <FeatureFlagRoleGate flag="admin_options_attendance" allowedRoles={['teacher', 'admin']}>
        <div>gated content</div>
      </FeatureFlagRoleGate>
    </Provider>
  );
}

describe('FeatureFlagRoleGate', () => {
  it('renders nothing before the user atom is hydrated', () => {
    useFeatureFlagEnabled.mockReturnValue(true);
    renderGated('', 'teacher');

    expect(screen.queryByText('gated content')).not.toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('renders nothing while the flag is still resolving', () => {
    useFeatureFlagEnabled.mockReturnValue(undefined);
    renderGated('user-1', 'teacher');

    expect(screen.queryByText('gated content')).not.toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('renders children for an allowed role with the flag enabled', () => {
    useFeatureFlagEnabled.mockReturnValue(true);
    renderGated('user-1', 'teacher');

    expect(screen.getByText('gated content')).toBeInTheDocument();
  });

  it('calls notFound for a disallowed role even with the flag enabled', () => {
    useFeatureFlagEnabled.mockReturnValue(true);

    expect(() => renderGated('user-1', 'parent')).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound for an allowed role when the flag is disabled', () => {
    useFeatureFlagEnabled.mockReturnValue(false);

    expect(() => renderGated('user-1', 'admin')).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
