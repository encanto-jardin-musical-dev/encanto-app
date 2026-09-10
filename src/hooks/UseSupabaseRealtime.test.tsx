import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { UseSupabaseRealtime } from './UseSupabaseRealtime';

const on = vi.fn();
const subscribe = vi.fn();
const removeChannel = vi.fn();
const channel = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    channel: (...args: unknown[]) => channel(...args),
    removeChannel: (...args: unknown[]) => removeChannel(...args),
  }),
}));

function Probe(props: {
  channelName: string;
  table: 'messages';
  event: 'INSERT';
  onStatus: (status: string) => void;
}) {
  const { status } = UseSupabaseRealtime({
    channelName: props.channelName,
    schema: 'public',
    table: props.table,
    event: props.event,
  });
  props.onStatus(status);
  return null;
}

describe('UseSupabaseRealtime', () => {
  it('subscribes to a channel on mount and reports connected on SUBSCRIBED', async () => {
    const fakeChannel = { on, subscribe };
    channel.mockReturnValue(fakeChannel);
    subscribe.mockImplementation((cb: (status: string) => void) => {
      cb('SUBSCRIBED');
      return fakeChannel;
    });

    const onStatus = vi.fn();
    render(<Probe channelName="messages-1" table="messages" event="INSERT" onStatus={onStatus} />);

    expect(channel).toHaveBeenCalledWith('messages-1');
    expect(on).toHaveBeenCalled();
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith('connected'));
  });

  it('removes the channel on unmount', () => {
    const fakeChannel = { on, subscribe };
    channel.mockReturnValue(fakeChannel);
    subscribe.mockImplementation(() => fakeChannel);

    const { unmount } = render(
      <Probe channelName="messages-1" table="messages" event="INSERT" onStatus={vi.fn()} />
    );
    removeChannel.mockClear();

    unmount();

    expect(removeChannel).toHaveBeenCalledWith(fakeChannel);
  });
});
