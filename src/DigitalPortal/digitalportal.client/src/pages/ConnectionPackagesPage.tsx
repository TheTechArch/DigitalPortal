import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner, Tabs } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import RawResponseToggle from '../components/RawResponseToggle';
import type { AuthorizedPartyDto, PaginatedResult as PartyPaginatedResult } from '../types/authorizedParties';
import type { CompactEntity, PaginatedResult } from '../types/connections';

const REQUIRED_SCOPES = [
  'altinn:accessmanagement/enduser:connections:fromothers.read',
  'altinn:accessmanagement/enduser:connections:toothers.read',
];

const RESOURCE_FILTER = 'altinn_access_management';

// ── Types ────────────────────────────────────────────────────────────────────

interface CompactPackage {
  id: string;
  urn: string | null;
  areaId: string | null;
}

interface CompactRole {
  id: string;
  code: string | null;
  urn: string | null;
}

interface ConnectionPackagePermission {
  from: CompactEntity;
  to: CompactEntity;
  via: CompactEntity | null;
  role: CompactRole | null;
  viaRole: CompactRole | null;
  reason: string | null;
}

interface ConnectionPackageDto {
  package: CompactPackage;
  permissions: ConnectionPackagePermission[];
}

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

// ── Entity display helper ────────────────────────────────────────────────────

function EntityBadge({ entity, label }: { entity: CompactEntity; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: '#EEF4FF' }}
      >
        {entity.type === 'Person' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <span className="text-sm font-semibold text-gray-900">{entity.name || '(ukjent)'}</span>
        {entity.organizationIdentifier && (
          <span className="text-xs text-gray-400 font-mono ml-2">Org: {entity.organizationIdentifier}</span>
        )}
        {entity.type && (
          <span className="text-xs px-1.5 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-100 ml-2">
            {entity.type}{entity.variant ? ` / ${entity.variant}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Connection package card ──────────────────────────────────────────────────

function ConnectionPackageCard({ item }: { item: ConnectionPackageDto }) {
  const pkg = item.package;
  const permissions = item.permissions ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Package header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#ECFDF5' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <div>
          <span className="font-semibold text-gray-900 text-sm">
            {pkg.urn?.split(':').pop() ?? pkg.id}
          </span>
          <p className="text-xs text-gray-400 font-mono">{pkg.urn}</p>
          <code className="text-xs text-gray-300 font-mono">{pkg.id}</code>
        </div>
      </div>

      {/* Permissions */}
      {permissions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tillatelser ({permissions.length})
          </p>
          {permissions.map((perm, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <EntityBadge entity={perm.from} label="Fra" />
                <EntityBadge entity={perm.to} label="Til" />
              </div>

              {perm.via && (
                <EntityBadge entity={perm.via} label="Via" />
              )}

              <div className="flex flex-wrap gap-2 mt-1">
                {perm.role && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {perm.role.code ?? perm.role.urn}
                  </span>
                )}
                {perm.viaRole && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                    via: {perm.viaRole.code ?? perm.viaRole.urn}
                  </span>
                )}
                {perm.reason && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                    {perm.reason}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Result panel (shared by both tabs) ────────────────────────────────────────

function ConnectionPackagesResultPanel({
  direction,
  isLoading,
  error,
  items,
  onRefresh,
}: {
  direction: 'from' | 'to';
  isLoading: boolean;
  error: string | null;
  items: ConnectionPackageDto[];
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
        <Spinner aria-label="Henter..." />
        <span className="text-sm">Henter tilkoblingspakker fra Altinn...</span>
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
          {items.length} pakke{items.length !== 1 ? 'r' : ''}
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

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
          <Paragraph className="text-gray-400">
            Ingen tilkoblingspakker funnet {direction === 'from' ? 'fra' : 'til'} denne parten.
          </Paragraph>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ConnectionPackageCard key={item.package?.id ?? i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ConnectionPackagesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, tokenInfo } = useAuth();

  // Parties state
  const [parties, setParties] = useState<AuthorizedPartyDto[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [partiesError, setPartiesError] = useState<string | null>(null);

  // Connection packages state
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [direction, setDirection] = useState<'from' | 'to'>('from');
  const [data, setData] = useState<PaginatedResult<ConnectionPackageDto> | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const hasScope = REQUIRED_SCOPES.some((s) => tokenInfo?.scopes?.includes(s));

  // Fetch authorized parties
  useEffect(() => {
    if (authLoading || !isAuthenticated || !hasScope) return;
    setPartiesLoading(true);
    fetch(`/api/accessmanagement/authorizedparties?includeResources=true&anyOfResourceIds=${RESOURCE_FILTER}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PartyPaginatedResult<AuthorizedPartyDto[]>>;
      })
      .then((result) => {
        const flat = result.data?.flat() ?? [];
        setParties(flat);
      })
      .catch((e) => setPartiesError(e.message))
      .finally(() => setPartiesLoading(false));
  }, [authLoading, isAuthenticated, hasScope]);

  // Fetch connection packages when party or direction changes
  const fetchData = useCallback(() => {
    if (!selectedParty) return;
    setDataLoading(true);
    setDataError(null);

    const params = new URLSearchParams();
    params.set('party', selectedParty);
    if (direction === 'from') {
      params.set('from', selectedParty);
    } else {
      params.set('to', selectedParty);
    }

    fetch(`/api/connectionpackages?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PaginatedResult<ConnectionPackageDto>>;
      })
      .then(setData)
      .catch((e) => setDataError(e.message))
      .finally(() => setDataLoading(false));
  }, [selectedParty, direction]);

  useEffect(() => {
    if (selectedParty) fetchData();
  }, [selectedParty, direction, fetchData]);

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
            Tokenet mangler et av scopene for tilkoblingspakker:{' '}
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

  const items = data?.data ?? [];

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
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <Heading level={1} data-size="lg">
            Tilkoblingspakker
          </Heading>
        </div>
        <Paragraph className="text-gray-600">
          Se tilkoblingspakker (connection packages) mellom parter. Velg en autorisert part og velg om du vil se
          pakker fra eller til den valgte parten.
        </Paragraph>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {REQUIRED_SCOPES.map((s) => (
            <code key={s} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
              {s}
            </code>
          ))}
          <span className="text-xs text-gray-400">
            · <span className="font-mono">GET /accessmanagement/api/v1/enduser/connections/accesspackages</span>
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
                GET /accessmanagement/api/v1/enduser/connections/accesspackages
                {selectedParty
                  ? `?party=${selectedParty}&${direction}=${selectedParty}`
                  : '?party=...'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with results */}
      {!selectedParty ? (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <Paragraph className="text-gray-400">Velg en part for å hente tilkoblingspakker</Paragraph>
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
            <ConnectionPackagesResultPanel
              direction="from"
              isLoading={dataLoading}
              error={dataError}
              items={items}
              onRefresh={fetchData}
            />
          </Tabs.Panel>

          <Tabs.Panel value="to">
            <ConnectionPackagesResultPanel
              direction="to"
              isLoading={dataLoading}
              error={dataError}
              items={items}
              onRefresh={fetchData}
            />
          </Tabs.Panel>
        </Tabs>
      )}

      <RawResponseToggle data={data} />
    </div>
  );
}
