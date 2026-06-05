/**
 * AuthContext — Cadence mobile.
 *
 * Responsibilities:
 *  - Hold access_token in memory (never written to disk)
 *  - Persist refresh_token in expo-secure-store
 *  - On mount: attempt silent refresh from stored refresh_token
 *  - Expose login(), logout(), and auth state to the whole app
 *  - Set Authorization header on apiClient for every authenticated request
 *  - Intercept 401 responses → try one silent refresh → retry original request
 */

import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authApi } from '../api/auth';
import { apiClient } from '../api/client';

const REFRESH_TOKEN_KEY = 'cadence_refresh_token';

// ─── Types ────────────────────────────────────────────────────

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  accessToken: string | null;
  /** Call after a successful login or register API response. */
  storeTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Used to queue requests while a token refresh is in flight
  const isRefreshing = useRef(false);
  const refreshQueue = useRef<Array<(token: string | null) => void>>([]);

  // ── Helpers ──────────────────────────────────────────────────

  const applyAccessToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, []);

  const storeTokens = useCallback(
    async (newAccessToken: string, refreshToken: string) => {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      applyAccessToken(newAccessToken);
      setStatus('authenticated');
    },
    [applyAccessToken],
  );

  const logout = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (stored) await authApi.logout(stored);
    } catch {
      // Best-effort — clear local state regardless
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    applyAccessToken(null);
    setStatus('unauthenticated');
  }, [applyAccessToken]);

  // ── Silent refresh on mount ───────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!stored) {
          setStatus('unauthenticated');
          return;
        }
        const data = await authApi.refresh(stored);
        await storeTokens(data.access_token, data.refresh_token);
      } catch {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        setStatus('unauthenticated');
      }
    })();
  }, [storeTokens]);

  // ── 401 interceptor ──────────────────────────────────────────

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (error?.response?.status !== 401 || original._retry) {
          return Promise.reject(error);
        }
        original._retry = true;

        // Don't try to refresh if the failing request is itself an auth endpoint
        if (original.url?.includes('/auth/')) {
          return Promise.reject(error);
        }

        if (isRefreshing.current) {
          // Queue this request until the refresh resolves
          return new Promise((resolve, reject) => {
            refreshQueue.current.push((token) => {
              if (!token) return reject(error);
              original.headers['Authorization'] = `Bearer ${token}`;
              resolve(apiClient(original));
            });
          });
        }

        isRefreshing.current = true;
        try {
          const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          if (!stored) throw new Error('No refresh token');
          const data = await authApi.refresh(stored);
          await storeTokens(data.access_token, data.refresh_token);
          // Drain queue
          refreshQueue.current.forEach((cb) => cb(data.access_token));
          refreshQueue.current = [];
          original.headers['Authorization'] = `Bearer ${data.access_token}`;
          return apiClient(original);
        } catch {
          refreshQueue.current.forEach((cb) => cb(null));
          refreshQueue.current = [];
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          applyAccessToken(null);
          setStatus('unauthenticated');
          return Promise.reject(error);
        } finally {
          isRefreshing.current = false;
        }
      },
    );

    return () => apiClient.interceptors.response.eject(interceptor);
  }, [storeTokens, applyAccessToken]);

  // ─────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ status, accessToken, storeTokens, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
