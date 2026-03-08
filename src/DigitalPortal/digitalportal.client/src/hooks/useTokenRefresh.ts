import { useEffect, useRef } from 'react';
import { refreshTokens } from '../services/authService';

const REFRESH_BUFFER_SECONDS = 60; // refresh this many seconds before expiry

interface UseTokenRefreshOptions {
  accessTokenExpiresAt: string | null;
  /** Called after a successful refresh with the new expiry times */
  onRefreshed: (newAccessExpiry: string | null, newAltinnExpiry: string | null) => void;
  /** Called if the refresh fails (session likely expired) */
  onExpired: () => void;
}

export function useTokenRefresh({ accessTokenExpiresAt, onRefreshed, onExpired }: UseTokenRefreshOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!accessTokenExpiresAt) return;

    const expiresMs = new Date(accessTokenExpiresAt).getTime();
    const nowMs = Date.now();
    const msUntilRefresh = expiresMs - nowMs - REFRESH_BUFFER_SECONDS * 1000;

    if (msUntilRefresh <= 0) {
      // Token already expired or expiring very soon – refresh immediately
      void doRefresh();
      return;
    }

    timerRef.current = setTimeout(() => void doRefresh(), msUntilRefresh);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    async function doRefresh() {
      try {
        const result = await refreshTokens();
        onRefreshed(result.accessTokenExpiresAt, result.altinnTokenExpiresAt);
      } catch {
        onExpired();
      }
    }
  }, [accessTokenExpiresAt, onRefreshed, onExpired]);
}
