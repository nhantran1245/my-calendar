/**
 * Login page — Cadence desktop.
 *
 * Centered card layout. Ctrl+Enter submits the form.
 * On success: calls onSuccess(accessToken, refreshToken) to update AuthContext.
 * On failure: shows inline error.
 */

import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../api/auth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface LoginPageProps {
  onSuccess: (accessToken: string, refreshToken: string) => void;
  onNavigateRegister: () => void;
}

export function LoginPage({ onSuccess, onNavigateRegister }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  // Ctrl+Enter global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleLogin();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(identifier.trim(), password);
      onSuccess(data.access_token, data.refresh_token);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Username or password is incorrect.');
      } else if (!err?.response) {
        setError('Unable to connect to the server. Check your connection and try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>

        {/* ── Brand ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={wordmarkStyle}>Cadence</div>
          <div style={subtitleStyle}>Log in to your account</div>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <Input
            label="Username or email"
            placeholder="Enter username or email"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
            autoComplete="username"
            disabled={loading}
          />

          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            isPassword
            autoComplete="current-password"
            disabled={loading}
          />

          {/* ── Error ── */}
          {error && (
            <div style={errorStyle}>
              <span role="alert">{error}</span>
            </div>
          )}

          {/* ── Submit ── */}
          <div style={{ marginTop: 4 }}>
            <Button
              variant="primary"
              size="md"
              style={{ width: '100%', justifyContent: 'center' }}
              loading={loading}
              disabled={loading}
              type="submit"
              kbd="⌃↵"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </div>
        </form>

        {/* ── Footer ── */}
        <div style={footerStyle}>
          <span style={{ color: 'var(--fg-2)', fontSize: 13 }}>
            Don't have an account?
          </span>
          <button
            type="button"
            onClick={onNavigateRegister}
            style={linkBtnStyle}
          >
            Register
          </button>
        </div>

        {/* ── Keyboard hint ── */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            Press Ctrl+Enter to submit
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const outerStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-page)',
  padding: '24px 16px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--bg-0)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '40px 36px',
  boxShadow: 'var(--shadow-md)',
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 40,
  lineHeight: 1,
  letterSpacing: '-0.03em',
  color: 'var(--fg-0)',
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--fg-2)',
};

const errorStyle: React.CSSProperties = {
  background: 'var(--danger-tint)',
  border: '1px solid var(--danger)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--danger)',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 6,
  marginTop: 24,
};

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--accent)',
  cursor: 'pointer',
};
