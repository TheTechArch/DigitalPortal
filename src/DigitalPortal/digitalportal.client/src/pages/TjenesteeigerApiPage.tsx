import { Heading, Paragraph } from '@digdir/designsystemet-react';

export default function TjenesteeigerApiPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 bg-green-100 text-green-800">
        Tjenesteeier-API
      </div>
      <Heading level={1} data-size="xl" className="mb-4">
        Tilgangsstyring via tjenesteeier-API
      </Heading>
      <Paragraph data-size="lg" className="text-gray-600 mb-8 max-w-2xl">
        Her vises hvordan du som tjenesteeier bruker Maskinporten og Altinns tjenesteeier-API
        til å opprette ressurser, administrere rettigheter og kontrollere tilgang i dine tjenester.
      </Paragraph>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
        <strong>Under utvikling</strong> – Demo-innhold kommer her.
      </div>
    </div>
  );
}
