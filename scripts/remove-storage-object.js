#!/usr/bin/env node
/**
 * Remove one or more objects from the private `message-attachments` Supabase
 * Storage bucket via the sanctioned Storage API (`.remove()`), which also
 * clears the corresponding `storage.objects` DB row. Direct SQL deletes are
 * blocked by Supabase's `protect_delete()` trigger, so this API path is the
 * correct way to delete storage objects (including phantom rows with no
 * backing file, such as the synthetic orphan created during testing).
 *
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/remove-storage-object.js [<path> ...]
 *
 * If no <path> args are given, defaults to removing the synthetic test object
 * left behind by orphan-sweep verification:
 *   messages/2020/01/orphan-test-0000-0000-0000-000000000000.pdf
 *
 * ENV VARS:
 *   NEXT_PUBLIC_SUPABASE_URL     — project URL
 *   SUPABASE_SERVICE_ROLE_KEY    — service-role key (bypasses Storage RLS)
 *   SUPABASE_BUCKET              — optional, default "message-attachments"
 */

import { createClient } from '@supabase/supabase-js';

const DEFAULT_PATHS = [
  'messages/2020/01/orphan-test-0000-0000-0000-000000000000.pdf',
];

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? 'message-attachments';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const paths = process.argv.slice(2);
  const targets = paths.length > 0 ? paths : DEFAULT_PATHS;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Removing ${targets.length} object(s) from bucket "${SUPABASE_BUCKET}":`);
  for (const t of targets) console.log(`  - ${t}`);

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .remove(targets);

  if (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }

  const removed = data ?? [];
  console.log(`Removed ${removed.length} object row(s).`);
  for (const obj of removed) {
    console.log(`  [ok] ${obj.name}`);
  }

  // Report any requested paths that were not returned as removed.
  const removedNames = new Set(removed.map((o) => o.name));
  for (const t of targets) {
    if (!removedNames.has(t)) {
      console.warn(`  [warn] not reported as removed (may not exist): ${t}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
