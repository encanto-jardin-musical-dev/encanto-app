import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useInfiniteScrollSentinel } from './UseInfiniteScrollSentinel';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let observeSpy: ReturnType<typeof vi.fn>;
let disconnectSpy: ReturnType<typeof vi.fn>;
let lastCallback: ObserverCallback | undefined;

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    lastCallback = callback;
  }
  observe = observeSpy;
  disconnect = disconnectSpy;
  unobserve = vi.fn();
}

function Sentinel(props: {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) {
  const ref = useInfiniteScrollSentinel(props);
  return <div data-testid="sentinel" ref={ref} />;
}

describe('useInfiniteScrollSentinel', () => {
  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    lastCallback = undefined;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observes the sentinel element on mount', () => {
    render(<Sentinel fetchNextPage={vi.fn()} hasNextPage isFetchingNextPage={false} />);

    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('calls fetchNextPage when the sentinel intersects and there is a next page', () => {
    const fetchNextPage = vi.fn();
    render(<Sentinel fetchNextPage={fetchNextPage} hasNextPage isFetchingNextPage={false} />);

    lastCallback?.([{ isIntersecting: true }]);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchNextPage when there is no next page', () => {
    const fetchNextPage = vi.fn();
    render(
      <Sentinel fetchNextPage={fetchNextPage} hasNextPage={false} isFetchingNextPage={false} />
    );

    lastCallback?.([{ isIntersecting: true }]);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does not call fetchNextPage while already fetching the next page', () => {
    const fetchNextPage = vi.fn();
    render(<Sentinel fetchNextPage={fetchNextPage} hasNextPage isFetchingNextPage />);

    lastCallback?.([{ isIntersecting: true }]);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(
      <Sentinel fetchNextPage={vi.fn()} hasNextPage isFetchingNextPage={false} />
    );

    unmount();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
