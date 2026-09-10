import { describe, expect, it, vi } from 'vitest';
import { runCleanupExecute, runCleanupPreview } from './run-cleanup';
import type { TypedSupabaseClient } from '@/utils/supabase/client';

function clientWithInvoke(result: { data: unknown; error: unknown }) {
  return { functions: { invoke: vi.fn().mockResolvedValue(result) } } as unknown as TypedSupabaseClient;
}

describe('runCleanupPreview', () => {
  it('invokes admin-data-cleanup in preview mode and returns the response', async () => {
    const response = { cutoff: '2024-01-01', entities: { messages: 3 } };
    const client = clientWithInvoke({ data: response, error: null });

    const result = await runCleanupPreview(client);

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-data-cleanup', {
      body: { mode: 'preview' },
    });
    expect(result).toEqual(response);
  });

  it('throws when the edge function errors', async () => {
    const client = clientWithInvoke({ data: null, error: { message: 'boom' } });

    await expect(runCleanupPreview(client)).rejects.toThrow('Cleanup preview failed: boom');
  });

  it('parses a JSON error body from the function error context', async () => {
    const error = { message: 'boom', context: { json: vi.fn().mockResolvedValue({ error: 'RATE_LIMITED' }) } };
    const client = clientWithInvoke({ data: null, error });

    await expect(runCleanupPreview(client)).rejects.toThrow('Cleanup preview failed: RATE_LIMITED');
  });

  it('throws on an unexpected response shape', async () => {
    const client = clientWithInvoke({ data: {}, error: null });

    await expect(runCleanupPreview(client)).rejects.toThrow(
      'Cleanup preview failed: unexpected response shape'
    );
  });
});

describe('runCleanupExecute', () => {
  it('invokes admin-data-cleanup in execute mode with the cutoff and confirmation phrase', async () => {
    const response = { entities: { messages: 3 } };
    const client = clientWithInvoke({ data: response, error: null });

    const result = await runCleanupExecute(client, '2024-01-01', 'DELETE');

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-data-cleanup', {
      body: { mode: 'execute', cutoff: '2024-01-01', confirmationPhrase: 'DELETE' },
    });
    expect(result).toEqual(response);
  });

  it('throws when the edge function errors', async () => {
    const client = clientWithInvoke({ data: null, error: { message: 'boom' } });

    await expect(runCleanupExecute(client, '2024-01-01', 'DELETE')).rejects.toThrow(
      'Cleanup execute failed: boom'
    );
  });

  it('throws on an unexpected response shape', async () => {
    const client = clientWithInvoke({ data: {}, error: null });

    await expect(runCleanupExecute(client, '2024-01-01', 'DELETE')).rejects.toThrow(
      'Cleanup execute failed: unexpected response shape'
    );
  });
});
