import { Link } from 'react-router-dom';
import { Button, Heading, Paragraph, Card } from '@digdir/designsystemet-react';

const features = [
  {
    to: '/sluttbruker-api',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Sluttbruker-API',
    description:
      'Demonstrerer tilgangskontroll sett fra sluttbrukerens perspektiv. Se hvordan en bruker kan logge inn, hente sine rettigheter og få tilgang til tjenester på vegne av seg selv eller en virksomhet.',
    tag: 'Brukerrettet',
    tagColor: 'bg-blue-100 text-blue-800',
  },
  {
    to: '/tjenesteeier-api',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Tjenesteeier-API',
    description:
      'Viser hvordan du som tjenesteeier kan administrere tilgang til dine tjenester. Opprett og administrer ressurser, deleger rettigheter og styr hvem som har tilgang til hva.',
    tag: 'Tjenesteeierstyrt',
    tagColor: 'bg-green-100 text-green-800',
  },
  {
    to: '/pdp',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Policy Decision Point (PDP)',
    description:
      'Integrer Altinns PDP direkte i din applikasjon for å ta autorisasjonsbeslutninger i sanntid. Se eksempler på XACML-baserte forespørsler og responser for tilgangskontroll.',
    tag: 'Autorisasjon',
    tagColor: 'bg-purple-100 text-purple-800',
  },
  {
    to: '/tilkoblinger',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    title: 'Tilkoblinger',
    description:
      'Se tilkoblinger mellom parter i Altinn. Velg en autorisert part og utforsk hvem som har tilkoblinger fra eller til den valgte parten, med roller, tilgangspakker og ressurser.',
    tag: 'Connections',
    tagColor: 'bg-teal-100 text-teal-800',
  },
];

const highlights = [
  {
    icon: '⚡',
    title: 'Sanntids tilgangskontroll',
    text: 'Ta autorisasjonsbeslutninger direkte i din portal via Altinn PDP uten ekstra rundturer.',
  },
  {
    icon: '🔐',
    title: 'Standardbasert sikkerhet',
    text: 'XACML, Maskinporten og ID-porten – bygg på etablerte, sikre standarder.',
  },
  {
    icon: '🏛️',
    title: 'For offentlige tjenesteeiere',
    text: 'Designet for virksomheter som ønsker å bruke Altinn som autoritativ kilde for tilgang.',
  },
  {
    icon: '📦',
    title: 'Klar til bruk',
    text: 'Referansekode du kan bruke direkte som utgangspunkt for din egen implementasjon.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E4D8C 0%, #0F2D5A 60%, #061628 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#4A90D9', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: '#2563EB', transform: 'translate(-20%, 20%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 bg-white/10 text-white/90 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Referanseimplementasjon – Altinn autorisasjon
            </div>

            <Heading level={1} data-size="2xl" className="text-white mb-6" style={{ color: 'white' }}>
              Tilgangsstyring med Altinn i din egen portal
            </Heading>

            <Paragraph data-size="lg" className="mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
              En praktisk referanseimplementasjon for offentlige tjenesteeiere som vil bruke
              Altinns autorisasjonsplattform til å styre tilgang i egne portal- og plattformløsninger.
              Utforsk sluttbruker-API, tjenesteeier-API og PDP med live eksempler.
            </Paragraph>

            <div className="flex flex-wrap gap-4">
              <Button asChild data-size="lg" variant="primary" style={{ backgroundColor: 'white', color: '#1E4D8C' }}>
                <Link to="/sluttbruker-api">Utforsk demoene</Link>
              </Button>
              <Button
                asChild
                data-size="lg"
                variant="secondary"
                style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'transparent' }}
              >
                <a href="https://docs.altinn.studio/nb/authorization/guides/resource-owner/" target="_blank" rel="noopener noreferrer">
                  Les dokumentasjonen
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <Heading level={2} data-size="xl" className="mb-4">
            Hva demonstrerer DigitalPortal?
          </Heading>
          <Paragraph data-size="lg" className="text-gray-600 max-w-2xl mx-auto">
            Fire hoveddeler dekker de viktigste integrasjonspunktene mot Altinn autorisasjon.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="no-underline group">
              <Card className="h-full p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-200 group-hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-gray-50 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    {f.icon}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${f.tagColor}`}>
                    {f.tag}
                  </span>
                </div>
                <Heading level={3} data-size="sm" className="mb-2">
                  {f.title}
                </Heading>
                <Paragraph data-size="sm" className="text-gray-600">
                  {f.description}
                </Paragraph>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium" style={{ color: '#1E4D8C' }}>
                  Utforsk
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Heading level={2} data-size="lg" className="mb-3">
              Hvorfor bruke Altinn til tilgangsstyring?
            </Heading>
            <Paragraph className="text-gray-600 max-w-xl mx-auto">
              Altinn har bygget infrastruktur for tilgangsstyring som du kan gjenbruke i din løsning.
            </Paragraph>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h) => (
              <div key={h.title} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-3xl mb-3">{h.icon}</div>
                <Heading level={3} data-size="xs" className="mb-2">{h.title}</Heading>
                <Paragraph data-size="sm" className="text-gray-600">{h.text}</Paragraph>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Heading level={2} data-size="lg" className="mb-4">
          Kom i gang
        </Heading>
        <Paragraph data-size="lg" className="text-gray-600 mb-8 max-w-xl mx-auto">
          Velg en av demoseksjonene og se kode og API-kall i praksis.
        </Paragraph>
        <div className="flex flex-wrap justify-center gap-4">
          {features.map((f) => (
            <Button key={f.to} asChild variant="secondary">
              <Link to={f.to}>{f.title}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
