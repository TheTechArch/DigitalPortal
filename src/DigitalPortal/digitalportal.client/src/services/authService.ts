import type { RefreshResult, ScopeDefinition, TokenInfo } from '../types/auth';

export async function getScopes(): Promise<ScopeDefinition[]> {
  const res = await fetch('/api/auth/scopes');
  if (!res.ok) throw new Error('Failed to load scopes');
  return res.json();
}

export async function getMe(): Promise<TokenInfo> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error('Failed to load user info');
  return res.json();
}

export async function refreshTokens(): Promise<RefreshResult> {
  const res = await fetch('/api/auth/refresh', { method: 'POST' });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

/** Build the login URL for redirect – scopes are passed to the backend */
export function buildLoginUrl(scopes: string[]): string {
  const scopeParam = encodeURIComponent(scopes.join(' '));
  return `/api/auth/login?scopes=${scopeParam}`;
}
