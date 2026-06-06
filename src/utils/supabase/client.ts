import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;
let client: TypedSupabaseClient | undefined;

export function createClient(): TypedSupabaseClient {
  if (client) {
    return client;
  }
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  return client;
}
