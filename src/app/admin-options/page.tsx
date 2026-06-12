import NavigationBar from '@/components/common/NavigationBar';

export default function AdminOptionsPage() {
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle="Admin Options" />
      <h1 className="text-center font-bold text-primary">Admin Options</h1>
    </section>
  );
}
