import { vi } from 'vitest';

export type MockResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

const CHAINABLE_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'is',
  'in',
  'contains',
  'or',
  'and',
  'order',
  'limit',
  'range',
  'match',
  'filter',
] as const;

export type MockQueryBuilder = {
  [K in (typeof CHAINABLE_METHODS)[number]]: ReturnType<typeof vi.fn>;
} & {
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: Promise<MockResult>['then'];
};

/**
 * Builds a chainable Postgrest query-builder mock. Every chainable method
 * (`.eq()`, `.order()`, `.limit()`, ...) returns the same builder so tests
 * can assert on any link in the chain; the builder itself is awaitable
 * (mirrors Postgrest's thenable builder) and `.single()`/`.maybeSingle()`
 * resolve to the same configured result.
 */
export function createQueryBuilderMock<T = unknown>(
  result: MockResult<T> = { data: null, error: null }
): MockQueryBuilder {
  const builder = {} as MockQueryBuilder;

  for (const method of CHAINABLE_METHODS) {
    builder[method] = vi.fn(() => builder);
  }

  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

/**
 * Builds a fake `TypedSupabaseClient`. Pass `fromResults` keyed by table
 * name to control what `.from('<table>')` resolves to; unlisted tables
 * resolve to `{ data: null, error: null }`.
 *
 * Usage in a hook test:
 *   vi.mock('@/utils/supabase/client', () => ({
 *     createClient: () => createSupabaseClientMock({ children: { data: [...], error: null } }),
 *   }));
 *
 * Usage in a query-function test (no module mock needed, just pass it in):
 *   const client = createSupabaseClientMock({ children: { data: [...], error: null } });
 *   await getChildById(client as unknown as TypedSupabaseClient, 'id');
 */
export function createSupabaseClientMock(fromResults: Record<string, MockResult> = {}) {
  const from = vi.fn((table: string) =>
    createQueryBuilderMock(fromResults[table] ?? { data: null, error: null })
  );

  return {
    from,
    rpc: vi.fn((): Promise<MockResult> => Promise.resolve({ data: null, error: null })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() => Promise.resolve({ data: null, error: null })),
        createSignedUrls: vi.fn(() => Promise.resolve({ data: null, error: null })),
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    channel: vi.fn(),
  };
}
