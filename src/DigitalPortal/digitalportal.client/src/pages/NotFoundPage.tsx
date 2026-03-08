import { Link } from 'react-router-dom';
import { Heading, Paragraph, Button } from '@digdir/designsystemet-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 py-24 px-4 text-center">
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <Heading level={1} data-size="lg" className="mb-3">
        Siden finnes ikke
      </Heading>
      <Paragraph className="text-gray-600 mb-8 max-w-md">
        Siden du leter etter eksisterer ikke eller har blitt flyttet.
      </Paragraph>
      <Button asChild variant="primary">
        <Link to="/">Gå til forsiden</Link>
      </Button>
    </div>
  );
}
