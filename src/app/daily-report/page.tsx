import NavigationBar from '@/components/common/NavigationBar';

export default function DailyReportPage() {
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle="Daily Report" />
      <h1 className="text-center font-bold text-primary">Daily Report</h1>
    </section>
  );
}
