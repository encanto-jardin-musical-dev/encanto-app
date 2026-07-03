import { AttendanceAccessGate } from '@/components/attendance/AttendanceAccessGate';
import { AttendanceLog } from '@/components/attendance/AttendanceLog';
import NavigationBar from '@/components/common/NavigationBar';
import { getGroupById } from '@/queries/groups/get-group-by-id';
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
  const group = await getGroupById(supabase, groupId);
  if (!group) notFound();

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4 overflow-hidden">
      <NavigationBar backRoute="/attendance" pageTitle={group.name} />
      <AttendanceAccessGate>
        <AttendanceLog groupId={groupId} />
      </AttendanceAccessGate>
    </section>
  );
}
