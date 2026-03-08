import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Paragraph, Button } from '@digdir/designsystemet-react';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-96 py-24 px-4 text-center">
      <div className="text-8xl font-bold text-gray-200 mb-4">{t('notFound.code')}</div>
      <Heading level={1} data-size="lg" className="mb-3">
        {t('notFound.heading')}
      </Heading>
      <Paragraph className="text-gray-600 mb-8 max-w-md">
        {t('notFound.description')}
      </Paragraph>
      <Button asChild variant="primary">
        <Link to="/">{t('notFound.backBtn')}</Link>
      </Button>
    </div>
  );
}
