import NavigationBar from '@/components/common/NavigationBar';

export default function TasksPage() {
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle="Tasks" />
      <h1 className="text-center font-bold text-primary">Tasks</h1>
    </section>
  );
}
