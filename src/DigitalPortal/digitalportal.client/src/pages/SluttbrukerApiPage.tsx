import { useTranslation } from 'react-i18next';
import { Heading, Paragraph } from '@digdir/designsystemet-react';

export default function SluttbrukerApiPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 bg-blue-100 text-blue-800">
        {t('sluttbrukerApi.badge')}
      </div>
      <Heading level={1} data-size="xl" className="mb-4">
        {t('sluttbrukerApi.heading')}
      </Heading>
      <Paragraph data-size="lg" className="text-gray-600 mb-8 max-w-2xl">
        {t('sluttbrukerApi.description')}
      </Paragraph>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
        <strong>{t('sluttbrukerApi.wip')}</strong>
      </div>
    </div>
  );
}
