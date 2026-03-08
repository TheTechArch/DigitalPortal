import { useCallback, useEffect, useState } from 'react';
import { getMe, logout as apiLogout } from '../services/authService';
import type { TokenInfo } from '../types/auth';

interface AuthState {
  tokenInfo: TokenInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    tokenInfo: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const info = await getMe();
      setState({ tokenInfo: info, isLoading: false, error: null });
    } catch {
      setState({ tokenInfo: null, isLoading: false, error: 'Could not load auth state' });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ tokenInfo: { isAuthenticated: false, idTokenClaims: null, accessTokenClaims: null, altinnTokenClaims: null, scopes: [], accessTokenExpiresAt: null, altinnTokenExpiresAt: null }, isLoading: false, error: null });
  }, []);

  return {
    tokenInfo: state.tokenInfo,
    isAuthenticated: state.tokenInfo?.isAuthenticated ?? false,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    logout,
  };
}
