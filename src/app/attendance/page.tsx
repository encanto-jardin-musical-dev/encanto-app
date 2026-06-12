import NavigationBar from '@/components/common/NavigationBar';

export default function AttendancePage() {
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle="Attendance" />
      <h1 className="text-center font-bold text-primary">Attendance</h1>
    </section>
  );
}
