import { AttendanceAccessGate } from '@/components/attendance/AttendanceAccessGate';
import { AttendanceLog } from '@/components/attendance/AttendanceLog';
import NavigationBar from '@/components/common/NavigationBar';
import { getGroupName } from '@/queries/groups/get-group-name';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

type AttendanceGroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AttendanceGroupPage({ params }: AttendanceGroupPageProps) {
  const { groupId } = await params;

  if (!UUID_PATTERN.test(groupId)) notFound();

  const supabase = await createClient();
  const groupName = await getGroupName(supabase, groupId);
  if (!groupName) notFound();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      {/* The gate wraps the nav bar too: gated users must see no attendance
          content, including the group name in the title. */}
      <AttendanceAccessGate>
        <NavigationBar backRoute="/attendance" pageTitle={groupName} />
        <AttendanceLog groupId={groupId} />
      </AttendanceAccessGate>
    </section>
  );
}
