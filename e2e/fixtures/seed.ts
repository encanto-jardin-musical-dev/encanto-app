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
  parent2: SeededRole;
  teacher: SeededRole;
  admin: SeededRole;
  groupId: string;
  teacherlessGroupId: string;
  secondGroupId: string;
  childId: string;
  secondChildId: string;
};

/** Group names the fixtures own — teardown matches on these to stay re-runnable. */
const FIXTURE_GROUP_NAMES = [
  'E2E Test Group',
  'E2E Teacherless Group',
  'E2E Second Teacher Group',
] as const;

const FIXTURE_EMAILS = [
  'e2e-parent@encanto.test',
  'e2e-parent2@encanto.test',
  'e2e-teacher@encanto.test',
  'e2e-admin@encanto.test',
] as const;

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
  role: 'parent' | 'teacher' | 'admin',
  /** Overrides the email slug so a role can be seeded more than once. */
  slug: string = role
): Promise<SeededRole> {
  const email = `e2e-${slug}@encanto.test`;

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
    // Slug-derived so a second user of the same role is distinguishable in the
    // UI (the contacts list renders "Parent E2E" and "Parent2 E2E").
    first_name: slug.charAt(0).toUpperCase() + slug.slice(1),
    last_name: 'E2E',
    // Slug-scoped so a second user of the same role doesn't collide on a
    // unique document_number.
    document_number: `e2e-${slug}`,
    document_type: 'other',
  });

  if (profileError) {
    throw new Error(`Failed to create ${role} fixture profile: ${profileError.message}`);
  }

  return { userId: data.user.id, email, password: FIXTURE_PASSWORD };
}

/**
 * Creates parent/teacher/admin fixture users plus:
 *
 * - `E2E Test Group` — teacher assigned, child 1 (guardian: parent 1)
 * - `E2E Teacherless Group` — no teacher assigned, child 1 also belongs here
 * - `E2E Second Teacher Group` — teacher assigned, child 2 (guardian: parent 2)
 *
 * The teacher belonging to two groups is what makes the Feed group selector
 * switchable; the two-parent split is what makes "the other group's guardian
 * must not see the message" assertable. Safe to re-run: existing fixture
 * users/rows are deleted first.
 */
export async function seedFixtures(): Promise<SeededFixtures> {
  const admin = getAdminClient();

  await teardownFixtures();

  const [parent, parent2, teacher, adminUser] = await Promise.all([
    createRoleUser(admin, 'parent'),
    createRoleUser(admin, 'parent', 'parent2'),
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

  const { data: teacherlessGroup, error: teacherlessGroupError } = await admin
    .from('groups')
    .insert({ name: 'E2E Teacherless Group' })
    .select('id')
    .single();

  if (teacherlessGroupError || !teacherlessGroup) {
    throw new Error(`Failed to create teacherless fixture group: ${teacherlessGroupError?.message}`);
  }

  const { data: secondGroup, error: secondGroupError } = await admin
    .from('groups')
    .insert({ name: 'E2E Second Teacher Group' })
    .select('id')
    .single();

  if (secondGroupError || !secondGroup) {
    throw new Error(`Failed to create second teacher fixture group: ${secondGroupError?.message}`);
  }

  const { error: secondGroupTeacherError } = await admin
    .from('group_teachers')
    .insert({ group_id: secondGroup.id, teacher_id: teacher.userId });

  if (secondGroupTeacherError) {
    throw new Error(
      `Failed to link fixture teacher to second group: ${secondGroupTeacherError.message}`
    );
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

  const { data: secondChild, error: secondChildError } = await admin
    .from('children')
    .insert({
      first_name: 'E2E',
      last_name: 'Second Child',
      birth_date: '2021-01-01',
      document_number: 'e2e-child-2',
      document_type: 'other',
      gender: 'female',
    })
    .select('id')
    .single();

  if (secondChildError || !secondChild) {
    throw new Error(`Failed to create second fixture child: ${secondChildError?.message}`);
  }

  const { error: childGroupError } = await admin
    .from('child_groups')
    .insert([
      { child_id: child.id, group_id: group.id },
      { child_id: child.id, group_id: teacherlessGroup.id },
      { child_id: secondChild.id, group_id: secondGroup.id },
    ]);

  if (childGroupError) {
    throw new Error(`Failed to link fixture child to group: ${childGroupError.message}`);
  }

  const { error: guardianError } = await admin
    .from('child_guardians')
    .insert([
      { child_id: child.id, guardian_id: parent.userId, relationship: 'mother' },
      {
        child_id: secondChild.id,
        guardian_id: parent2.userId,
        relationship: 'father',
      },
    ]);

  if (guardianError) {
    throw new Error(`Failed to link fixture guardian to child: ${guardianError.message}`);
  }

  return {
    parent,
    parent2,
    teacher,
    admin: adminUser,
    groupId: group.id,
    teacherlessGroupId: teacherlessGroup.id,
    secondGroupId: secondGroup.id,
    childId: child.id,
    secondChildId: secondChild.id,
  };
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
    .in('document_number', ['e2e-child', 'e2e-child-2']);
  const { data: groups } = await admin
    .from('groups')
    .select('id')
    .in('name', [...FIXTURE_GROUP_NAMES]);

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
  const fixtureEmails = new Set<string>(FIXTURE_EMAILS);
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
