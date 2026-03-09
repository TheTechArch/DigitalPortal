import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner, Switch } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import type { AuthorizedPartyDto, PaginatedResult as PartyPaginatedResult } from '../types/authorizedParties';
import type { ConnectionDto, PaginatedResult } from '../types/connections';

const REQUIRED_SCOPES = [
  'altinn:accessmanagement/enduser:connections:fromothers.read',
  'altinn:accessmanagement/enduser:connections:toothers.write',
];

const RESOURCE_FILTER = 'altinn_access_management';

// ── Party selector ───────────────────────────────────────────────────────────

function PartySelector({
  parties,
  selectedId,
  onSelect,
}: {
  parties: AuthorizedPartyDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        Velg part
      </label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="" disabled>
          Velg en part...
        </option>
        {parties.map((p) => (
          <option key={p.partyUuid} value={p.partyUuid}>
            {p.name} {p.organizationNumber ? `(${p.organizationNumber})` : ''} – {p.type}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Connection card ──────────────────────────────────────────────────────────

function ConnectionCard({ connection }: { connection: ConnectionDto }) {
  const party = connection.party;
  const roles = connection.roles ?? [];
  const packages = connection.packages ?? [];
  const resources = connection.resources ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: '#EEF4FF' }}
        >
          {party.type === 'Person' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{party.name || '(ukjent)'}</span>
            {party.type && (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-100">
                {party.type}
              </span>
            )}
            {party.isDeleted && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                Slettet
              </span>
            )}
          </div>

          {party.organizationIdentifier && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">Org: {party.organizationIdentifier}</p>
          )}
          <code className="text-xs text-gray-300 font-mono">{party.id}</code>

          {roles.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 font-medium">Roller</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map((r) => (
                  <span
                    key={r.id}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700"
                  >
                    {r.code ?? r.urn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {packages.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 font-medium">Tilgangspakker</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {packages.map((pkg) => (
                  <span
                    key={pkg.id}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700"
                  >
                    {pkg.urn?.split(':').pop() ?? pkg.id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resources.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 font-medium">Ressurser</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {resources.map((res) => (
                  <span
                    key={res.id}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-orange-50 text-orange-700"
                  >
                    {res.name ?? res.refId ?? res.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, tokenInfo } = useAuth();

  // Parties state
  const [parties, setParties] = useState<AuthorizedPartyDto[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [partiesError, setPartiesError] = useState<string | null>(null);

  // Connection state
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [direction, setDirection] = useState<'from' | 'to'>('from');
  const [connections, setConnections] = useState<PaginatedResult<ConnectionDto> | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  const hasScope = REQUIRED_SCOPES.some((s) => tokenInfo?.scopes?.includes(s));

  // Fetch authorized parties filtered on altinn_access_management
  useEffect(() => {
    if (authLoading || !isAuthenticated || !hasScope) return;
    setPartiesLoading(true);
    fetch(`/api/accessmanagement/authorizedparties?includeResources=true&anyOfResourceIds=${RESOURCE_FILTER}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PartyPaginatedResult<AuthorizedPartyDto[]>>;
      })
      .then((data) => {
        const flat = data.data?.flat() ?? [];
        setParties(flat);
      })
      .catch((e) => setPartiesError(e.message))
      .finally(() => setPartiesLoading(false));
  }, [authLoading, isAuthenticated, hasScope]);

  // Fetch connections when party or direction changes
  const fetchConnections = useCallback(() => {
    if (!selectedParty) return;
    setConnectionsLoading(true);
    setConnectionsError(null);

    const params = new URLSearchParams();
    params.set('party', selectedParty);
    if (direction === 'from') {
      params.set('from', selectedParty);
    } else {
      params.set('to', selectedParty);
    }

    fetch(`/api/connections?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PaginatedResult<ConnectionDto>>;
      })
      .then(setConnections)
      .catch((e) => setConnectionsError(e.message))
      .finally(() => setConnectionsLoading(false));
  }, [selectedParty, direction]);

  useEffect(() => {
    if (selectedParty) fetchConnections();
  }, [selectedParty, direction, fetchConnections]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner aria-label="Laster..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

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
          <Heading level={2} data-size="md" className="mb-2">
            Manglende scope
          </Heading>
          <Paragraph className="text-gray-600 mb-6">
            Tokenet mangler et av scopene for tilkoblinger:{' '}
            {REQUIRED_SCOPES.map((s) => (
              <code
                key={s}
                className="bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-800 font-mono text-xs mr-1"
              >
                {s}
              </code>
            ))}
            . Logg inn på nytt og velg minst ett av disse.
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

  const connectionsList = connections?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1E4D8C' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <Heading level={1} data-size="lg">
            Tilkoblinger
          </Heading>
        </div>
        <Paragraph className="text-gray-600">
          Se tilkoblinger (connections) mellom parter. Velg en autorisert part og velg om du vil se tilkoblinger fra
          eller til den valgte parten.
        </Paragraph>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {REQUIRED_SCOPES.map((s) => (
            <code key={s} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
              {s}
            </code>
          ))}
          <span className="text-xs text-gray-400">
            · <span className="font-mono">GET /accessmanagement/api/v1/enduser/connections</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
            {/* Party selector */}
            {partiesLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Spinner aria-label="Henter parter..." data-size="sm" />
                Henter parter...
              </div>
            ) : partiesError ? (
              <div className="text-sm text-red-600">Feil: {partiesError}</div>
            ) : parties.length === 0 ? (
              <div className="text-sm text-gray-500">
                Ingen parter med ressursen <code className="font-mono text-xs">{RESOURCE_FILTER}</code> funnet.
              </div>
            ) : (
              <PartySelector parties={parties} selectedId={selectedParty} onSelect={setSelectedParty} />
            )}

            <hr className="border-gray-100" />

            {/* Direction switch */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Retning</p>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${direction === 'from' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  Fra part
                </span>
                <Switch
                  checked={direction === 'to'}
                  onChange={() => setDirection((d) => (d === 'from' ? 'to' : 'from'))}
                  data-size="md"
                >
                  {direction === 'from' ? 'Fra' : 'Til'}
                </Switch>
                <span className={`text-sm ${direction === 'to' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  Til part
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {direction === 'from'
                  ? 'Viser tilkoblinger der valgt part er avsender (from)'
                  : 'Viser tilkoblinger der valgt part er mottaker (to)'}
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Query preview */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Generert spørring</p>
              <code className="text-xs text-gray-600 break-all font-mono">
                GET /accessmanagement/api/v1/enduser/connections
                {selectedParty
                  ? `?party=${selectedParty}&${direction}=${selectedParty}`
                  : '?party=...'}
              </code>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!selectedParty && (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <Paragraph className="text-gray-400">Velg en part for å hente tilkoblinger</Paragraph>
            </div>
          )}

          {connectionsLoading && (
            <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
              <Spinner aria-label="Henter..." />
              <span className="text-sm">Henter tilkoblinger fra Altinn...</span>
            </div>
          )}

          {connectionsError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <Heading level={2} data-size="sm" className="text-red-800 mb-2">
                Feil
              </Heading>
              <code className="text-sm text-red-700 block">{connectionsError}</code>
            </div>
          )}

          {selectedParty && !connectionsLoading && !connectionsError && (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm text-gray-500">
                  {connectionsList.length} tilkobling{connectionsList.length !== 1 ? 'er' : ''}
                  {' · '}
                  {direction === 'from' ? 'fra' : 'til'} valgt part
                </p>
                <button
                  onClick={fetchConnections}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.96" />
                  </svg>
                  Oppdater
                </button>
              </div>

              {connectionsList.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
                  <Paragraph className="text-gray-400">
                    Ingen tilkoblinger funnet {direction === 'from' ? 'fra' : 'til'} denne parten.
                  </Paragraph>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectionsList.map((conn, i) => (
                    <ConnectionCard key={conn.party?.id ?? i} connection={conn} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
