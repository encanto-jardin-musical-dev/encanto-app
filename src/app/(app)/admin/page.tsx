import { AdminShortcuts } from '@/components/admin/AdminShortcuts';
import { AdminSummaryPanel } from '@/components/admin/AdminSummaryPanel';
import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function AdminOptionsPage() {
  const t = await getTranslations('ActionButton');
  const pageTitle = t('actions.admin-options');

  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4 p-4">
      <NavigationBar backRoute="/feed" pageTitle={pageTitle} />
      <div className="flex flex-col gap-6">
        <AdminShortcuts />
        <AdminSummaryPanel />
      </div>
    </section>
  );
}
