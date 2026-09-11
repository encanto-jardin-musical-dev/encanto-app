import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const FIXTURE_PASSWORD = 'e2e-test-password-123!';

export type SeededRole = {
  userId: string;
  email: string;
  password: string;
};

export type SeededFixtures = {
  parent: SeededRole;
  teacher: SeededRole;
  admin: SeededRole;
  groupId: string;
  childId: string;
};

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'e2e fixtures require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
        '(from `supabase start` — service role key, local instance only).'
    );
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createRoleUser(
  admin: ReturnType<typeof getAdminClient>,
  role: 'parent' | 'teacher' | 'admin'
): Promise<SeededRole> {
  const email = `e2e-${role}@encanto.test`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${role} fixture user: ${error?.message}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    role,
    first_name: role.charAt(0).toUpperCase() + role.slice(1),
    last_name: 'E2E',
    document_number: `e2e-${role}`,
    document_type: 'other',
  });

  if (profileError) {
    throw new Error(`Failed to create ${role} fixture profile: ${profileError.message}`);
  }

  return { userId: data.user.id, email, password: FIXTURE_PASSWORD };
}

/**
 * Creates a parent, teacher, and admin fixture user, plus one group with the
 * teacher assigned and one child in that group linked to the parent as
 * guardian. Safe to re-run: existing fixture users/rows are deleted first.
 */
export async function seedFixtures(): Promise<SeededFixtures> {
  const admin = getAdminClient();

  await teardownFixtures();

  const [parent, teacher, adminUser] = await Promise.all([
    createRoleUser(admin, 'parent'),
    createRoleUser(admin, 'teacher'),
    createRoleUser(admin, 'admin'),
  ]);

  const { data: group, error: groupError } = await admin
    .from('groups')
    .insert({ name: 'E2E Test Group' })
    .select('id')
    .single();

  if (groupError || !group) {
    throw new Error(`Failed to create fixture group: ${groupError?.message}`);
  }

  const { error: groupTeacherError } = await admin
    .from('group_teachers')
    .insert({ group_id: group.id, teacher_id: teacher.userId });

  if (groupTeacherError) {
    throw new Error(`Failed to link fixture teacher to group: ${groupTeacherError.message}`);
  }

  const { data: child, error: childError } = await admin
    .from('children')
    .insert({
      first_name: 'E2E',
      last_name: 'Child',
      birth_date: '2020-01-01',
      document_number: 'e2e-child',
      document_type: 'other',
      gender: 'male',
    })
    .select('id')
    .single();

  if (childError || !child) {
    throw new Error(`Failed to create fixture child: ${childError?.message}`);
  }

  const { error: childGroupError } = await admin
    .from('child_groups')
    .insert({ child_id: child.id, group_id: group.id });

  if (childGroupError) {
    throw new Error(`Failed to link fixture child to group: ${childGroupError.message}`);
  }

  const { error: guardianError } = await admin
    .from('child_guardians')
    .insert({ child_id: child.id, guardian_id: parent.userId, relationship: 'mother' });

  if (guardianError) {
    throw new Error(`Failed to link fixture guardian to child: ${guardianError.message}`);
  }

  return { parent, teacher, admin: adminUser, groupId: group.id, childId: child.id };
}

/**
 * Removes fixture rows from a previous run, in FK-safe order: join tables
 * first, then children/groups, then the fixture auth users.
 */
export async function teardownFixtures(): Promise<void> {
  const admin = getAdminClient();

  const { data: children } = await admin
    .from('children')
    .select('id')
    .eq('document_number', 'e2e-child');
  const { data: groups } = await admin.from('groups').select('id').eq('name', 'E2E Test Group');

  const childIds = (children ?? []).map((c) => c.id);
  const groupIds = (groups ?? []).map((g) => g.id);

  if (childIds.length > 0) {
    await admin.from('child_guardians').delete().in('child_id', childIds);
    await admin.from('child_groups').delete().in('child_id', childIds);
  }
  if (groupIds.length > 0) {
    await admin.from('group_teachers').delete().in('group_id', groupIds);
  }
  if (childIds.length > 0) {
    await admin.from('children').delete().in('id', childIds);
  }
  if (groupIds.length > 0) {
    await admin.from('groups').delete().in('id', groupIds);
  }

  const { data: usersPage } = await admin.auth.admin.listUsers();
  const fixtureEmails = new Set(
    (['parent', 'teacher', 'admin'] as const).map((role) => `e2e-${role}@encanto.test`)
  );
  const existingFixtureUsers = (usersPage?.users ?? []).filter((u) =>
    u.email ? fixtureEmails.has(u.email) : false
  );
  const existingFixtureIds = existingFixtureUsers.map((u) => u.id);

  // messages/daily_reports/tasks/attendance use ON DELETE RESTRICT (not
  // CASCADE) on the fixture user's id, so specs that send a message, clock
  // in, or create a report/task leave rows that block deleteUser below.
  // Without this cleanup, deleteUser fails, the stale fixture user survives,
  // and the next run's createUser errors with "already registered".
  if (existingFixtureIds.length > 0) {
    const idList = existingFixtureIds.join(',');
    await admin.from('messages').delete().or(`sender_id.in.(${idList}),receiver_id.in.(${idList})`);
    await admin.from('daily_reports').delete().in('teacher_id', existingFixtureIds);
    await admin.from('tasks').delete().in('teacher_id', existingFixtureIds);
    await admin.from('attendance').delete().in('recorded_by', existingFixtureIds);
  }

  for (const user of existingFixtureUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      throw new Error(`Failed to delete fixture user ${user.email}: ${error.message}`);
    }
  }
}
