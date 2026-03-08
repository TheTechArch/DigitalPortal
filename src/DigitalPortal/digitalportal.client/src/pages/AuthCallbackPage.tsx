import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heading, Paragraph, Button, Spinner } from '@digdir/designsystemet-react';
import { getMe } from '../services/authService';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import type { TokenInfo } from '../types/auth';

// ── Small helper components ──────────────────────────────────────────────────

function ClaimsTable({ claims }: { claims: Record<string, unknown> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-1/3">Claim</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600">Verdi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Object.entries(claims).map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500 font-semibold align-top">{key}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-800 break-all">
                {formatClaimValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatClaimValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number' && (String(value).length === 10)) {
    // Likely a Unix timestamp
    const date = new Date(value * 1000);
    return `${value} (${date.toLocaleString('nb-NO')})`;
  }
  return String(value ?? '');
}

// ── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = 'id' | 'access' | 'altinn';

const tabs: { key: TabKey; label: string; color: string; borderColor: string }[] = [
  { key: 'id', label: 'ID-token', color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' },
  { key: 'access', label: 'Access-token', color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' },
  { key: 'altinn', label: 'Altinn-token', color: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-500' },
];

// ── Expiry countdown ─────────────────────────────────────────────────────────

function ExpiryBadge({ expiresAt, label }: { expiresAt: string | null; label: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft < 120;

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
      isWarning
        ? 'bg-amber-50 border-amber-300 text-amber-800'
        : 'bg-green-50 border-green-300 text-green-800'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
      {label}: {mins}m {secs}s
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('id');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const error = searchParams.get('error');

  useEffect(() => {
    if (error) { setIsLoading(false); return; }
    getMe()
      .then(setTokenInfo)
      .catch(() => {/* show nothing, error handled below */})
      .finally(() => setIsLoading(false));
  }, [error]);

  const handleRefreshed = useCallback((newAccessExpiry: string | null, newAltinnExpiry: string | null) => {
    setRefreshedAt(new Date());
    setTokenInfo((prev) => prev ? {
      ...prev,
      accessTokenExpiresAt: newAccessExpiry,
      altinnTokenExpiresAt: newAltinnExpiry,
    } : prev);
  }, []);

  const handleExpired = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  useTokenRefresh({
    accessTokenExpiresAt: tokenInfo?.accessTokenExpiresAt ?? null,
    onRefreshed: handleRefreshed,
    onExpired: handleExpired,
  });

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <Heading level={1} data-size="lg" className="mb-3">Innlogging feilet</Heading>
        <Paragraph className="text-gray-600 mb-2">
          ID-porten returnerte en feil under innloggingen.
        </Paragraph>
        <code className="text-sm bg-red-50 border border-red-200 px-3 py-1.5 rounded text-red-700 block mb-8">
          {error}
        </code>
        <Button variant="primary" onClick={() => navigate('/login')}>Prøv igjen</Button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner aria-label="Laster tokeninformasjon..." />
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!tokenInfo?.isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heading level={1} data-size="lg" className="mb-3">Ikke innlogget</Heading>
        <Button variant="primary" onClick={() => navigate('/login')}>Logg inn</Button>
      </div>
    );
  }

  const claimsForTab: Record<TabKey, Record<string, unknown> | null> = {
    id: tokenInfo.idTokenClaims,
    access: tokenInfo.accessTokenClaims,
    altinn: tokenInfo.altinnTokenClaims,
  };

  const displayName =
    tokenInfo.idTokenClaims?.['name'] as string
    ?? tokenInfo.accessTokenClaims?.['sub'] as string
    ?? 'Innlogget bruker';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Hero strip */}
      <div className="rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1E4D8C 0%, #0F2D5A 100%)' }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Heading level={1} data-size="md" style={{ color: 'white' }}>
              {displayName}
            </Heading>
          </div>
          <Paragraph data-size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Innlogget via ID-porten · {tokenInfo.scopes.length} scope{tokenInfo.scopes.length !== 1 ? 's' : ''}
          </Paragraph>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExpiryBadge expiresAt={tokenInfo.accessTokenExpiresAt} label="Access-token" />
          {tokenInfo.altinnTokenExpiresAt && (
            <ExpiryBadge expiresAt={tokenInfo.altinnTokenExpiresAt} label="Altinn-token" />
          )}
        </div>
      </div>

      {/* Auto-refresh notice */}
      {refreshedAt && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.96" />
          </svg>
          Token ble automatisk fornyet kl. {refreshedAt.toLocaleTimeString('nb-NO')}
        </div>
      )}

      {/* Scopes */}
      <div className="mb-8">
        <Heading level={2} data-size="xs" className="mb-3 text-gray-500 uppercase tracking-wide">
          Innvilgede scopes
        </Heading>
        <div className="flex flex-wrap gap-2">
          {tokenInfo.scopes.map((sc) => (
            <code key={sc} className="text-xs bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 font-mono shadow-sm">
              {sc}
            </code>
          ))}
        </div>
      </div>

      {/* Token tabs */}
      <div>
        <Heading level={2} data-size="xs" className="mb-3 text-gray-500 uppercase tracking-wide">
          Token-innhold
        </Heading>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-4 gap-1">
          {tabs.map((tab) => {
            const hasClaims = claimsForTab[tab.key] !== null;
            return (
              <button
                key={tab.key}
                onClick={() => hasClaims && setActiveTab(tab.key)}
                disabled={!hasClaims}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
                  activeTab === tab.key
                    ? `${tab.borderColor} text-gray-900`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!hasClaims ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {tab.label}
                {!hasClaims && <span className="ml-2 text-xs">(ikke tilgjengelig)</span>}
              </button>
            );
          })}
        </div>

        {/* Claims table */}
        {claimsForTab[activeTab] ? (
          <ClaimsTable claims={claimsForTab[activeTab]!} />
        ) : (
          <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
            Ingen token tilgjengelig for dette alternativet.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Tilbake til forsiden
        </Button>
        <Button
          variant="tertiary"
          onClick={async () => {
            const fresh = await getMe();
            setTokenInfo(fresh);
            setRefreshedAt(new Date());
          }}
        >
          Oppdater tokeninformasjon
        </Button>
      </div>
    </div>
  );
}
