import { Heading, Paragraph } from '@digdir/designsystemet-react';

export default function PdpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 bg-purple-100 text-purple-800">
        Autorisasjon
      </div>
      <Heading level={1} data-size="xl" className="mb-4">
        Policy Decision Point (PDP)
      </Heading>
      <Paragraph data-size="lg" className="text-gray-600 mb-8 max-w-2xl">
        Demonstrerer integrasjon mot Altinns PDP for å ta autorisasjonsbeslutninger i sanntid.
        Se XACML-forespørsler og -responser, og forstå hvordan du kan bruke PDP direkte i
        din applikasjonslogikk.
      </Paragraph>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
        <strong>Under utvikling</strong> – Demo-innhold kommer her.
      </div>
    </div>
  );
}
