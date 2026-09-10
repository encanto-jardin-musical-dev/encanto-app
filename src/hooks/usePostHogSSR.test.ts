import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const capture = vi.fn();
const identify = vi.fn();

vi.mock('@/lib/posthog/client', () => ({
  posthogClient: { capture: (...args: unknown[]) => capture(...args), identify: (...args: unknown[]) => identify(...args) },
}));

const { usePostHogPageView, usePostHogIdentify } = await import('./usePostHogSSR');

describe('usePostHogPageView', () => {
  beforeEach(() => {
    capture.mockReset();
  });

  it('captures a $pageview with the current pathname', () => {
    renderHook(() => usePostHogPageView('/feed'));

    expect(capture).toHaveBeenCalledWith('$pageview', { $current_url: '/feed' });
  });

  it('captures again when the pathname changes', () => {
    const { rerender } = renderHook(({ pathname }) => usePostHogPageView(pathname), {
      initialProps: { pathname: '/feed' },
    });
    capture.mockClear();

    rerender({ pathname: '/messages' });

    expect(capture).toHaveBeenCalledWith('$pageview', { $current_url: '/messages' });
  });
});

describe('usePostHogIdentify', () => {
  beforeEach(() => {
    identify.mockReset();
  });

  it('identifies the user when a userId is provided', () => {
    renderHook(() => usePostHogIdentify('user-1', { role: 'parent' }));

    expect(identify).toHaveBeenCalledWith('user-1', { role: 'parent' });
  });

  it('does not identify when userId is undefined', () => {
    renderHook(() => usePostHogIdentify(undefined));

    expect(identify).not.toHaveBeenCalled();
  });
});
