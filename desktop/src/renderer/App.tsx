/**
 * App root — Cadence desktop.
 *
 * Auth state machine:
 *   'checking'       → splash / loading screen while validating stored token
 *   'unauthenticated' → show Login or Register page
 *   'authenticated'  → show main calendar shell
 *
 * Token storage: access_token lives in memory (this state).
 * refresh_token should be stored via Electron IPC → OS keychain.
 * For MVP, both are kept in memory and cleared on window close.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from './api/client';
import { authApi } from './api/auth';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './pages/Login';
import { MonthCalendar } from './pages/MonthCalendar';
import { RegisterPage } from './pages/Register';

type AuthState = 'checking' | 'unauthenticated' | 'authenticated';
type AuthPage  = 'login' | 'register';

export default function App() {
  const [authState, setAuthState]       = useState<AuthState>('checking');
  const [authPage, setAuthPage]         = useState<AuthPage>('login');
  const [accessToken, setAccessToken]   = useState<string | null>(null);

  // On mount: attempt silent token refresh
  // In MVP, we skip keychain — just go straight to login
  useEffect(() => {
    setAuthState('unauthenticated');
  }, []);

  // Inject access token into axios for authenticated requests
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  const handleAuthSuccess = useCallback(
    (newAccessToken: string, refreshToken: string) => {
      setAccessToken(newAccessToken);
      setAuthState('authenticated');
      // TODO: store refreshToken via electronAPI.setToken IPC call
    },
    [],
  );

  const handleLogout = useCallback(() => {
    setAccessToken(null);
    setAuthState('unauthenticated');
    setAuthPage('login');
  }, []);

  // ── Checking splash ──────────────────────────────────────────
  if (authState === 'checking') {
    return (
      <div style={splashStyle}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, color: 'var(--fg-0)', letterSpacing: '-0.03em' }}>
          Cadence
        </span>
      </div>
    );
  }

  // ── Auth screens ─────────────────────────────────────────────
  if (authState === 'unauthenticated') {
    if (authPage === 'register') {
      return (
        <RegisterPage
          onSuccess={handleAuthSuccess}
          onNavigateLogin={() => setAuthPage('login')}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={handleAuthSuccess}
        onNavigateRegister={() => setAuthPage('register')}
      />
    );
  }

  // ── Main app ──────────────────────────────────────────────────
  return (
    <NotificationProvider accessToken={accessToken!}>
      <MonthCalendar onLogout={handleLogout} />
    </NotificationProvider>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const splashStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-page)',
};
