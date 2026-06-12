import NavigationBar from '@/components/common/NavigationBar';
import { getTranslations } from 'next-intl/server';

export default async function AttendancePage() {
  const t = await getTranslations('ActionButton');
  const pageTitle = t('actions.attendance');
  return (
    <section className="grid grid-rows-[auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle={pageTitle} />
      <h1 className="text-center font-bold text-primary">{pageTitle}</h1>
    </section>
  );
}
