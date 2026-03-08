import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import type { MyClient, PaginatedResult } from '../types/clientDelegations';

const REQUIRED_SCOPE = 'altinn:clientdelegations/myclients.read';

// ── Helpers ───────────────────────────────────────────────────────────────────

function orgLabel(id?: string) {
  return id ? `Org.nr. ${id}` : null;
}

// ── Client card ───────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: import('../types/clientDelegations').ClientItem }) {
  const roleCount = client.access.length;
  const packageCount = client.access.reduce((sum, a) => sum + (a.packages?.length ?? 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{client.client.name}</p>
          {orgLabel(client.client.organizationIdentifier) && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {orgLabel(client.client.organizationIdentifier)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{client.client.type}</p>

          {client.access.length > 0 && (
            <div className="mt-3 space-y-2">
              {client.access.map((a) => (
                <div key={a.role?.id ?? a.role?.code} className="text-xs">
                  <span className="inline-block bg-purple-50 border border-purple-100 text-purple-800 rounded px-2 py-0.5 font-mono">
                    {a.role?.code ?? a.role?.urn}
                  </span>
                  {a.packages?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-1">
                      {a.packages.map((pkg) => (
                        <span key={pkg.id} className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-mono text-xs">
                          {pkg.urn.split(':').pop()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-right text-xs text-gray-400 flex-shrink-0 space-y-1">
          <div>{roleCount} rolle{roleCount !== 1 ? 'r' : ''}</div>
          {packageCount > 0 && <div>{packageCount} pakke{packageCount !== 1 ? 'r' : ''}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Provider section ──────────────────────────────────────────────────────────

function ProviderSection({ group }: { group: MyClient }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      {/* Provider header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#1E4D8C' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{group.provider.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {orgLabel(group.provider.organizationIdentifier) && (
              <span className="text-xs text-gray-400 font-mono">
                {orgLabel(group.provider.organizationIdentifier)}
              </span>
            )}
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">
              {group.clients.length} klient{group.clients.length !== 1 ? 'er' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Clients grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {group.clients.map((c) => (
          <ClientCard key={c.client.id} client={c} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyClientsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, tokenInfo } = useAuth();
  const [result, setResult] = useState<PaginatedResult<MyClient> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasScope = tokenInfo?.scopes?.includes(REQUIRED_SCOPE) ?? false;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!hasScope) return; // show scope warning, don't fetch

    setIsLoading(true);
    fetch('/api/clientdelegations/myclients')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`${res.status}: ${body}`);
        }
        return res.json() as Promise<PaginatedResult<MyClient>>;
      })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [authLoading, isAuthenticated, hasScope, navigate]);

  // ── Loading auth ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner aria-label="Laster..." />
      </div>
    );
  }

  // ── Missing scope ───────────────────────────────────────────────────────────
  if (!hasScope) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <Heading level={2} data-size="md" className="mb-2">Manglende scope</Heading>
          <Paragraph className="text-gray-600 mb-6">
            Du er logget inn, men tokenet ditt mangler scopet{' '}
            <code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-800 font-mono text-sm">
              {REQUIRED_SCOPE}
            </code>
            . Logg inn på nytt og velg dette scopet for å se dine klienter.
          </Paragraph>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1E4D8C' }}
          >
            Logg inn på nytt
          </button>
        </div>
      </div>
    );
  }

  // ── Loading data ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex justify-center items-center gap-3 text-gray-500">
          <Spinner aria-label="Henter klienter fra Altinn..." />
          <span className="text-sm">Henter klienter fra Altinn...</span>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Heading level={2} data-size="md" className="mb-2 text-red-800">Feil ved henting av klienter</Heading>
          <code className="text-sm text-red-700 block mb-6">{error}</code>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-red-700 text-white text-sm font-medium cursor-pointer hover:bg-red-800 transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  const groups = result?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1E4D8C' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <Heading level={1} data-size="lg">Mine klienter</Heading>
        </div>
        <Paragraph className="text-gray-600">
          Oversikt over organisasjoner og systemer som har fått delegert tilgang til å opptre på vegne av deg eller din organisasjon.
        </Paragraph>
        <div className="mt-3 flex items-center gap-2">
          <code className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
            {REQUIRED_SCOPE}
          </code>
          <span className="text-xs text-gray-400">
            · <span className="font-mono">GET /accessmanagement/api/v1/enduser/clientdelegations/my/clients</span>
          </span>
        </div>
      </div>

      {/* Results */}
      {groups.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <Heading level={2} data-size="sm" className="text-gray-500 mb-2">Ingen klienter funnet</Heading>
          <Paragraph data-size="sm" className="text-gray-400">
            Det finnes ingen klientdelegeringer for din bruker eller dine organisasjoner.
          </Paragraph>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {groups.length} leverandør{groups.length !== 1 ? 'er' : ''} ·{' '}
              {groups.reduce((s, g) => s + g.clients.length, 0)} klienter totalt
            </p>
          </div>
          <div className="space-y-6">
            {groups.map((group) => (
              <ProviderSection key={group.provider.id} group={group} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
