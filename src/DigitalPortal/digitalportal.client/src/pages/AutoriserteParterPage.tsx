import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import type {
  AuthorizedPartyDto,
  AuthorizedPartiesFilter,
  IncludeFilter,
  PaginatedResult,
} from '../types/authorizedParties';
import { defaultFilter, buildQueryString } from '../types/authorizedParties';

const REQUIRED_SCOPE = 'altinn:accessmanagement/authorizedparties';

// ── Filter panel ──────────────────────────────────────────────────────────────

function TriStateSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IncludeFilter;
  onChange: (v: IncludeFilter) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as IncludeFilter)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="auto">auto</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function FilterPanel({
  filter,
  onChange,
  onFetch,
  isLoading,
}: {
  filter: AuthorizedPartiesFilter;
  onChange: (f: AuthorizedPartiesFilter) => void;
  onFetch: () => void;
  isLoading: boolean;
}) {
  const set = <K extends keyof AuthorizedPartiesFilter>(key: K, val: AuthorizedPartiesFilter[K]) =>
    onChange({ ...filter, [key]: val });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Inkluder i svar</p>
        <div className="space-y-3">
          <Toggle label="Roller" checked={filter.includeRoles} onChange={v => set('includeRoles', v)} />
          <Toggle label="Tilgangspakker" checked={filter.includeAccessPackages} onChange={v => set('includeAccessPackages', v)} />
          <Toggle label="Ressurser" checked={filter.includeResources} onChange={v => set('includeResources', v)} />
          <Toggle label="Instanser" checked={filter.includeInstances} onChange={v => set('includeInstances', v)} />
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Inkluderingsfiltre</p>
        <div className="space-y-2.5">
          <TriStateSelect
            label="Parter via nøkkelroller"
            value={filter.includePartiesViaKeyRoles}
            onChange={v => set('includePartiesViaKeyRoles', v)}
          />
          <TriStateSelect
            label="Underenheter"
            value={filter.includeSubParties}
            onChange={v => set('includeSubParties', v)}
          />
          <TriStateSelect
            label="Inaktive parter"
            value={filter.includeInactiveParties}
            onChange={v => set('includeInactiveParties', v)}
          />
        </div>
      </div>

      <hr className="border-gray-100" />

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            partyFilter (UUID-er)
          </label>
          <textarea
            value={filter.partyFilter}
            onChange={e => set('partyFilter', e.target.value)}
            placeholder="e.g. uuid1, uuid2"
            rows={2}
            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            anyOfResourceIds
          </label>
          <textarea
            value={filter.anyOfResourceIds}
            onChange={e => set('anyOfResourceIds', e.target.value)}
            placeholder="e.g. resource-id-1, resource-id-2"
            rows={2}
            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <button
        onClick={onFetch}
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#1E4D8C' }}
      >
        {isLoading && <Spinner aria-label="" data-size="sm" />}
        {isLoading ? 'Henter...' : 'Hent autoriserte parter'}
      </button>

      {/* Live query string preview */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-1">Generert spørring</p>
        <code className="text-xs text-gray-600 break-all font-mono">
          GET /accessmanagement/api/v1/enduser/authorizedparties{buildQueryString(filter) || ''}
        </code>
      </div>
    </div>
  );
}

// ── Party card ────────────────────────────────────────────────────────────────

function typeBadge(type: string) {
  const map: Record<string, { label: string; className: string }> = {
    Organization: { label: 'Org', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    Person: { label: 'Person', className: 'bg-purple-50 text-purple-700 border-purple-100' },
    SelfIdentified: { label: 'Self', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  };
  const m = map[type] ?? { label: type, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${m.className}`}>
      {m.label}
    </span>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map(i => (
        <span key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded ${color}`}>{i}</span>
      ))}
    </div>
  );
}

function PartyCard({ party, depth = 0 }: { party: AuthorizedPartyDto; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasSubunits = party.subunits.length > 0;
  const hierarchyOnly = party.onlyHierarchyElementWithNoAccess;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}>
      <div className={`bg-white border rounded-xl p-4 mb-3 ${hierarchyOnly ? 'opacity-60 border-dashed border-gray-300' : 'border-gray-200 hover:shadow-sm transition-shadow'}`}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${hierarchyOnly ? 'bg-gray-100' : ''}`}
            style={!hierarchyOnly ? { backgroundColor: '#EEF4FF' } : {}}>
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
              <span className="font-semibold text-gray-900 text-sm">{party.name || '(ingen navn)'}</span>
              {typeBadge(party.type)}
              {party.isDeleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Slettet</span>
              )}
              {hierarchyOnly && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Kun hierarki</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {party.organizationNumber && (
                <code className="text-xs text-gray-400 font-mono">Org: {party.organizationNumber}</code>
              )}
              {party.unitType && (
                <code className="text-xs text-gray-400 font-mono">{party.unitType}</code>
              )}
              <code className="text-xs text-gray-300 font-mono">{party.partyUuid}</code>
            </div>

            {/* Access data */}
            {party.authorizedRoles.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Roller</p>
                <TagList items={party.authorizedRoles} color="bg-indigo-50 text-indigo-700" />
              </div>
            )}
            {party.authorizedAccessPackages.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Tilgangspakker</p>
                <TagList items={party.authorizedAccessPackages} color="bg-green-50 text-green-700" />
              </div>
            )}
            {party.authorizedResources.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Ressurser</p>
                <TagList items={party.authorizedResources} color="bg-orange-50 text-orange-700" />
              </div>
            )}
            {party.authorizedInstances.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Instanser ({party.authorizedInstances.length})</p>
                <TagList
                  items={party.authorizedInstances.map(i => `${i.resourceId}/${i.instanceId}`)}
                  color="bg-purple-50 text-purple-700"
                />
              </div>
            )}
          </div>

          {/* Subunit toggle */}
          {hasSubunits && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span>{party.subunits.length} underenhet{party.subunits.length !== 1 ? 'er' : ''}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Subunits */}
      {hasSubunits && expanded && (
        <div className="mb-3">
          {party.subunits.map(sub => (
            <PartyCard key={sub.partyUuid} party={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AutoriserteParterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, tokenInfo } = useAuth();
  const [filter, setFilter] = useState<AuthorizedPartiesFilter>(defaultFilter);
  const [result, setResult] = useState<PaginatedResult<AuthorizedPartyDto[]> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const hasScope = tokenInfo?.scopes?.includes(REQUIRED_SCOPE) ?? false;

  const fetchParties = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch(`/api/accessmanagement/authorizedparties${buildQueryString(filter)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PaginatedResult<AuthorizedPartyDto[]>>;
      })
      .then(data => { setResult(data); setHasFetched(true); })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [filter]);

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-96"><Spinner aria-label="Laster..." /></div>;
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!hasScope) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <Heading level={2} data-size="md" className="mb-2">Manglende scope</Heading>
          <Paragraph className="text-gray-600 mb-6">
            Tokenet mangler{' '}
            <code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-800 font-mono text-sm">
              {REQUIRED_SCOPE}
            </code>
            . Logg inn på nytt og velg dette scopet.
          </Paragraph>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1E4D8C' }}
          >
            Logg inn på nytt
          </button>
        </div>
      </div>
    );
  }

  const parties: AuthorizedPartyDto[] = result?.data?.flat() ?? [];
  const totalCount = parties.length;
  const subunitCount = parties.reduce((s, p) => s + (p.subunits?.length ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1E4D8C' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <Heading level={1} data-size="lg">Autoriserte parter</Heading>
        </div>
        <Paragraph className="text-gray-600">
          Hent hvilke parter (personer/organisasjoner) du har mottatt rettigheter til å representere i Altinn, med valgfrie filter for roller, tilgangspakker og ressurser.
        </Paragraph>
        <div className="mt-2 flex items-center gap-2">
          <code className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
            {REQUIRED_SCOPE}
          </code>
          <span className="text-xs text-gray-400">· <span className="font-mono">GET /accessmanagement/api/v1/enduser/authorizedparties</span></span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Filter sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <FilterPanel
            filter={filter}
            onChange={setFilter}
            onFetch={fetchParties}
            isLoading={isLoading}
          />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!hasFetched && !isLoading && (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <Paragraph className="text-gray-400">Velg filter og klikk «Hent autoriserte parter»</Paragraph>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
              <Spinner aria-label="Henter..." />
              <span className="text-sm">Henter fra Altinn...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <Heading level={2} data-size="sm" className="text-red-800 mb-2">Feil</Heading>
              <code className="text-sm text-red-700 block">{error}</code>
            </div>
          )}

          {hasFetched && !isLoading && !error && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm text-gray-500">
                  {totalCount} part{totalCount !== 1 ? 'er' : ''}
                  {subunitCount > 0 && ` · ${subunitCount} underenhet${subunitCount !== 1 ? 'er' : ''}`}
                </p>
                <button
                  onClick={fetchParties}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.96" />
                  </svg>
                  Oppdater
                </button>
              </div>

              {parties.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
                  <Paragraph className="text-gray-400">Ingen autoriserte parter funnet med disse filtrene.</Paragraph>
                </div>
              ) : (
                <div>
                  {parties.map(party => (
                    <PartyCard key={party.partyUuid} party={party} />
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
