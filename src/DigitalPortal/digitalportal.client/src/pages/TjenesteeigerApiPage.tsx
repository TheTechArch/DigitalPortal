import { useTranslation } from 'react-i18next';
import { Heading, Paragraph } from '@digdir/designsystemet-react';

export default function TjenesteeigerApiPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 bg-green-100 text-green-800">
        {t('tjenesteeigerApi.badge')}
      </div>
      <Heading level={1} data-size="xl" className="mb-4">
        {t('tjenesteeigerApi.heading')}
      </Heading>
      <Paragraph data-size="lg" className="text-gray-600 mb-8 max-w-2xl">
        {t('tjenesteeigerApi.description')}
      </Paragraph>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
        <strong>{t('tjenesteeigerApi.wip')}</strong>
      </div>
    </div>
  );
}
