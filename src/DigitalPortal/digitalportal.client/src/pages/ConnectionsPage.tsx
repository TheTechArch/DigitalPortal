import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner, Tabs } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import RawResponseToggle from '../components/RawResponseToggle';
import type { AuthorizedPartyDto, PaginatedResult as PartyPaginatedResult } from '../types/authorizedParties';
import type { ConnectionDto, PaginatedResult, AssignmentDto, AccessPackageDtoCheck, AssignmentPackageDto } from '../types/connections';

const REQUIRED_SCOPES = [
  'altinn:accessmanagement/enduser:connections:fromothers.read',
  'altinn:accessmanagement/enduser:connections:toothers.read',
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

function ConnectionCard({ connection, selectedParty }: { connection: ConnectionDto; selectedParty: string }) {
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
      <DelegatePackagePanel selectedParty={selectedParty} connection={connection} />
    </div>
  );
}

// ── Add connection form ──────────────────────────────────────────────────────

function AddConnectionForm({
  selectedParty,
  onCreated,
}: {
  selectedParty: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [personIdentifier, setPersonIdentifier] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AssignmentDto | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const params = new URLSearchParams();
    params.set('party', selectedParty);

    try {
      const res = await fetch(`/api/connections?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personIdentifier, lastName }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status}: ${text}`);

      const result = JSON.parse(text) as AssignmentDto;
      setSuccess(result);
      setPersonIdentifier('');
      setLastName('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
        style={{ color: '#1E4D8C' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-45' : ''}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Legg til tilkobling
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <Heading level={3} data-size="xs">
            Ny tilkobling
          </Heading>
          <Paragraph className="text-gray-500 text-sm">
            Oppgi fødselsnummer (eller brukernavn) og etternavn for personen du vil opprette tilkobling til.
          </Paragraph>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Fødselsnummer
              </label>
              <input
                type="text"
                value={personIdentifier}
                onChange={(e) => setPersonIdentifier(e.target.value)}
                placeholder="11-sifret fødselsnummer"
                maxLength={11}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Etternavn
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Etternavn"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !personIdentifier || !lastName}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1E4D8C' }}
            >
              {submitting ? 'Oppretter...' : 'Opprett tilkobling'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); setSuccess(null); }}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 cursor-pointer hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <span className="font-medium">Feil:</span> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              Tilkobling opprettet! ID: <code className="font-mono">{success.id}</code>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// ── Delegate package form ────────────────────────────────────────────────────

function DelegatePackagePanel({
  selectedParty,
  connection,
}: {
  selectedParty: string;
  connection: ConnectionDto;
}) {
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<AccessPackageDtoCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegating, setDelegating] = useState<string | null>(null);
  const [delegateError, setDelegateError] = useState<string | null>(null);
  const [delegateSuccess, setDelegateSuccess] = useState<AssignmentPackageDto | null>(null);

  const toPartyId = connection.party.id;

  const fetchDelegablePackages = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('party', selectedParty);

    fetch(`/api/connections/accesspackages/delegationcheck?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<{ data: AccessPackageDtoCheck[] }>;
      })
      .then((data) => setPackages(data.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleDelegate = async (pkg: AccessPackageDtoCheck) => {
    setDelegating(pkg.package.id);
    setDelegateError(null);
    setDelegateSuccess(null);

    const params = new URLSearchParams();
    params.set('party', selectedParty);
    params.set('to', toPartyId);
    params.set('package', pkg.package.urn ?? '');

    try {
      const res = await fetch(`/api/connections/accesspackages?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personIdentifier: connection.party.personIdentifier ?? '',
          lastName: '',
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status}: ${text}`);
      const result = JSON.parse(text) as AssignmentPackageDto;
      setDelegateSuccess(result);
    } catch (err) {
      setDelegateError(err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setDelegating(null);
    }
  };

  const delegable = packages.filter((p) => p.result);
  const notDelegable = packages.filter((p) => !p.result);

  return (
    <div className="mt-3 ml-12">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && packages.length === 0) fetchDelegablePackages();
        }}
        className="flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
        style={{ color: '#1E4D8C' }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Deleger pakker
      </button>

      {open && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Spinner aria-label="Sjekker..." data-size="sm" />
              Sjekker delegerbare pakker...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">Feil: {error}</div>
          )}

          {!loading && !error && packages.length === 0 && (
            <p className="text-sm text-gray-500">Ingen pakker funnet for delegering.</p>
          )}

          {delegable.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Kan delegeres ({delegable.length})
              </p>
              <div className="space-y-2">
                {delegable.map((pkg) => (
                  <div
                    key={pkg.package.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <code className="text-xs font-mono text-green-700">
                        {pkg.package.urn?.split(':').pop() ?? pkg.package.id}
                      </code>
                      <p className="text-xs text-gray-400 font-mono">{pkg.package.urn}</p>
                    </div>
                    <button
                      onClick={() => handleDelegate(pkg)}
                      disabled={delegating === pkg.package.id}
                      className="text-xs px-3 py-1.5 rounded-lg text-white font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#1E4D8C' }}
                    >
                      {delegating === pkg.package.id ? 'Delegerer...' : 'Deleger'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notDelegable.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Kan ikke delegeres ({notDelegable.length})
              </p>
              <div className="space-y-2">
                {notDelegable.map((pkg) => (
                  <div
                    key={pkg.package.id}
                    className="bg-white border border-gray-100 rounded-lg px-3 py-2 opacity-60"
                  >
                    <code className="text-xs font-mono text-gray-500">
                      {pkg.package.urn?.split(':').pop() ?? pkg.package.id}
                    </code>
                    {pkg.reasons && pkg.reasons.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {pkg.reasons.map((r) => r.description).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {delegateError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <span className="font-medium">Feil:</span> {delegateError}
            </div>
          )}

          {delegateSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              Pakke delegert! ID: <code className="font-mono">{delegateSuccess.id}</code>
            </div>
          )}

          <RawResponseToggle data={packages} />
        </div>
      )}
    </div>
  );
}

// ── Result panel (shared by both tabs) ────────────────────────────────────────

function ConnectionsResultPanel({
  direction,
  isLoading,
  error,
  connections,
  selectedParty,
  onRefresh,
}: {
  direction: 'from' | 'to';
  isLoading: boolean;
  error: string | null;
  connections: ConnectionDto[];
  selectedParty: string;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
        <Spinner aria-label="Henter..." />
        <span className="text-sm">Henter tilkoblinger fra Altinn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mt-4">
        <Heading level={2} data-size="sm" className="text-red-800 mb-2">
          Feil
        </Heading>
        <code className="text-sm text-red-700 block">{error}</code>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-gray-500">
          {connections.length} tilkobling{connections.length !== 1 ? 'er' : ''}
          {' · '}
          {direction === 'from' ? 'fra' : 'til'} valgt part
        </p>
        <button
          onClick={onRefresh}
          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.96" />
          </svg>
          Oppdater
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
          <Paragraph className="text-gray-400">
            Ingen tilkoblinger funnet {direction === 'from' ? 'fra' : 'til'} denne parten.
          </Paragraph>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn, i) => (
            <ConnectionCard key={conn.party?.id ?? i} connection={conn} selectedParty={selectedParty} />
          ))}
        </div>
      )}
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
          Se tilkoblinger (connections) mellom parter. Tilkoblinger er tilgjengelig for alle aktører du har
          tilgangsstyringsrettighet for. Velg en autorisert part og velg om du vil se tilkoblinger fra eller til den
          valgte parten.
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

      {/* Party selector + query preview */}
      <div className="mb-8">
        <div className="w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
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
      </div>

      {/* Add connection */}
      {selectedParty && (
        <AddConnectionForm selectedParty={selectedParty} onCreated={fetchConnections} />
      )}

      {/* Tabs with results */}
      {!selectedParty ? (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <Paragraph className="text-gray-400">Velg en part for å hente tilkoblinger</Paragraph>
        </div>
      ) : (
        <Tabs
          value={direction}
          onChange={(value) => setDirection(value as 'from' | 'to')}
          data-size="md"
        >
          <Tabs.List>
            <Tabs.Tab value="from">Fra part</Tabs.Tab>
            <Tabs.Tab value="to">Til part</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="from">
            <ConnectionsResultPanel
              direction="from"
              isLoading={connectionsLoading}
              error={connectionsError}
              connections={connectionsList}
              selectedParty={selectedParty!}
              onRefresh={fetchConnections}
            />
          </Tabs.Panel>

          <Tabs.Panel value="to">
            <ConnectionsResultPanel
              direction="to"
              isLoading={connectionsLoading}
              error={connectionsError}
              connections={connectionsList}
              selectedParty={selectedParty!}
              onRefresh={fetchConnections}
            />
          </Tabs.Panel>
        </Tabs>
      )}

      <RawResponseToggle data={connections} />
    </div>
  );
}
