import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useAuth } from '../hooks/useAuth';
import type {
  ConnectionDto,
  ConnectionsFilter,
  PaginatedResult,
} from '../types/connections';
import {
  defaultConnectionsFilter,
  buildConnectionsQueryString,
} from '../types/connections';

const READ_SCOPE = 'altinn:accessmanagement/enduser:connections:fromothers.read';

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  filter,
  onChange,
  onFetch,
  isLoading,
}: {
  filter: ConnectionsFilter;
  onChange: (f: ConnectionsFilter) => void;
  onFetch: () => void;
  isLoading: boolean;
}) {
  const set = <K extends keyof ConnectionsFilter>(key: K, val: ConnectionsFilter[K]) =>
    onChange({ ...filter, [key]: val });

  const partyMissing = !filter.party.trim();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
      {/* Required: party UUID */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
          party <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={filter.party}
          onChange={e => set('party', e.target.value)}
          placeholder="UUID til parten du representerer"
          className={`w-full text-xs font-mono border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            partyMissing ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        {partyMissing && (
          <p className="text-xs text-red-500 mt-1">Påkrevd – UUID fra Autoriserte parter</p>
        )}
      </div>

      {/* Optional filters */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">from (valgfri)</label>
          <input
            type="text"
            value={filter.from}
            onChange={e => set('from', e.target.value)}
            placeholder="UUID – filtrer på avsender"
            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">to (valgfri)</label>
          <input
            type="text"
            value={filter.to}
            onChange={e => set('to', e.target.value)}
            placeholder="UUID – filtrer på mottaker"
            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Inkluder i svar</p>
        <div className="space-y-3">
          <Toggle
            label="Klientdelegeringer"
            checked={filter.includeClientDelegations}
            onChange={v => set('includeClientDelegations', v)}
          />
          <Toggle
            label="Agenttilkoblinger"
            checked={filter.includeAgentConnections}
            onChange={v => set('includeAgentConnections', v)}
          />
        </div>
      </div>

      <button
        onClick={onFetch}
        disabled={isLoading || partyMissing}
        className="w-full py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#1E4D8C' }}
      >
        {isLoading && <Spinner aria-label="" data-size="sm" />}
        {isLoading ? 'Henter...' : 'Hent tilkoblinger'}
      </button>

      {/* Live query preview */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-1">Generert spørring</p>
        <code className="text-xs text-gray-600 break-all font-mono">
          GET /accessmanagement/api/v1/enduser/connections{buildConnectionsQueryString(filter) || '?party=…'}
        </code>
      </div>
    </div>
  );
}

// ── Connection card ───────────────────────────────────────────────────────────

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

function ConnectionCard({ conn, depth = 0 }: { conn: ConnectionDto; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasSubs = conn.connections?.length > 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#EEF4FF' }}>
            {conn.party?.type === 'Person' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-gray-900 text-sm">{conn.party?.name || '(ingen navn)'}</span>
              {conn.party?.type && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-medium">
                  {conn.party.type}
                </span>
              )}
            </div>

            {conn.party?.organizationIdentifier && (
              <code className="text-xs text-gray-400 font-mono block mb-1">
                Org: {conn.party.organizationIdentifier}
              </code>
            )}
            <code className="text-xs text-gray-300 font-mono block">{conn.party?.id}</code>

            {/* Roles */}
            {conn.roles?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Roller</p>
                <TagList items={conn.roles.map(r => r.code || r.urn)} color="bg-indigo-50 text-indigo-700" />
              </div>
            )}

            {/* Packages */}
            {conn.packages?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Tilgangspakker</p>
                <TagList items={conn.packages.map(p => p.urn?.split(':').pop() ?? p.urn)} color="bg-green-50 text-green-700" />
              </div>
            )}

            {/* Resources */}
            {conn.resources?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium">Ressurser</p>
                <TagList items={conn.resources.map(r => r.name || r.refId || r.id)} color="bg-orange-50 text-orange-700" />
              </div>
            )}
          </div>

          {/* Sub-connection toggle */}
          {hasSubs && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span>{conn.connections.length} sub</span>
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

      {/* Sub-connections */}
      {hasSubs && expanded && (
        <div className="mb-3">
          {conn.connections.map(sub => (
            <ConnectionCard key={sub.party?.id} conn={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Missing scope warning ─────────────────────────────────────────────────────

function ScopeWarning({ scope, onLogin }: { scope: string; onLogin: () => void }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto mt-8">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <Heading level={2} data-size="md" className="mb-2">Manglende scope</Heading>
      <Paragraph className="text-gray-600 mb-6">
        Tokenet mangler{' '}
        <code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-800 font-mono text-sm">{scope}</code>.
        Logg inn på nytt og velg dette scopet.
      </Paragraph>
      <button
        onClick={onLogin}
        className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#1E4D8C' }}
      >
        Logg inn på nytt
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, tokenInfo } = useAuth();
  const [filter, setFilter] = useState<ConnectionsFilter>(defaultConnectionsFilter);
  const [result, setResult] = useState<PaginatedResult<ConnectionDto> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const hasScope = tokenInfo?.scopes?.includes(READ_SCOPE) ?? false;

  const fetchConnections = useCallback(() => {
    if (!filter.party.trim()) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/accessmanagement/connections${buildConnectionsQueryString(filter)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json() as Promise<PaginatedResult<ConnectionDto>>;
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
      <div className="max-w-5xl mx-auto px-4 py-10">
        <PageHeader />
        <ScopeWarning scope={READ_SCOPE} onLogin={() => navigate('/login')} />
      </div>
    );
  }

  const connections: ConnectionDto[] = result?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader />

      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        {/* Filter sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <FilterPanel filter={filter} onChange={setFilter} onFetch={fetchConnections} isLoading={isLoading} />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!hasFetched && !isLoading && (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>
              <Paragraph className="text-gray-400">Fyll inn party-UUID og klikk «Hent tilkoblinger»</Paragraph>
              <Paragraph data-size="sm" className="text-gray-400 mt-1">
                Finn UUID-er på siden{' '}
                <button onClick={() => navigate('/autoriserte-parter')} className="underline cursor-pointer text-blue-500">
                  Autoriserte parter
                </button>
              </Paragraph>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
              <Spinner aria-label="Henter..." />
              <span className="text-sm">Henter fra Altinn...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <Heading level={2} data-size="sm" className="text-red-800 mb-2">Feil ved henting</Heading>
              <code className="text-sm text-red-700 block break-all">{error}</code>
            </div>
          )}

          {hasFetched && !isLoading && !error && (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm text-gray-500">
                  {connections.length} tilkobling{connections.length !== 1 ? 'er' : ''}
                </p>
                <button
                  onClick={fetchConnections}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.96" />
                  </svg>
                  Oppdater
                </button>
              </div>

              {connections.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
                  <Paragraph className="text-gray-400">Ingen tilkoblinger funnet for denne parten.</Paragraph>
                </div>
              ) : (
                <div>
                  {connections.map(conn => (
                    <ConnectionCard key={conn.party?.id} conn={conn} />
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

function PageHeader() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1E4D8C' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </div>
        <Heading level={1} data-size="lg">Enduser tilkoblinger</Heading>
      </div>
      <Paragraph className="text-gray-600">
        Hent tilkoblinger for en gitt part – viser hvilke systembrukere og agenter som har tilgang, med tilhørende roller, tilgangspakker og ressurser.
      </Paragraph>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <code className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
          {READ_SCOPE}
        </code>
        <span className="text-xs text-gray-400">· <span className="font-mono">GET /accessmanagement/api/v1/enduser/connections</span></span>
      </div>
    </div>
  );
}
