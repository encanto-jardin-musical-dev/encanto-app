import { MapIcon } from '@heroicons/react/24/outline';
import { getTranslations } from 'next-intl/server';
import BackToFeedButton from '@/components/common/BackToFeedButton';

export default async function NotFound() {
  const t = await getTranslations('NotFound');

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-screen text-default-300 p-4">
      <MapIcon className="w-16 h-16" />
      <h1 className="text-xl font-bold text-primary">{t('title')}</h1>
      <p className="text-center">{t('description')}</p>
      <div className="pt-6">
        <BackToFeedButton label={t('backToFeed')} />
      </div>
    </div>
  );
}
