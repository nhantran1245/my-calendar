/**
 * Register page — Cadence desktop.
 *
 * Live password strength checklist, confirm-match indicator.
 * Ctrl+Enter submits. On success: calls onSuccess with tokens.
 */

import React, { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  PasswordStrength,
  passwordIsStrong,
} from '../components/PasswordStrength';

interface RegisterPageProps {
  onSuccess: (accessToken: string, refreshToken: string) => void;
  onNavigateLogin: () => void;
}

export function RegisterPage({ onSuccess, onNavigateLogin }: RegisterPageProps) {
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Field-level errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError]       = useState('');
  const [confirmError, setConfirmError]   = useState('');

  const passwordStrong   = passwordIsStrong(password);
  const passwordsMatch   = confirmPw.length > 0 && confirmPw === password;
  const passwordMismatch = confirmPw.length > 0 && confirmPw !== password;

  const canSubmit =
    username.trim().length >= 3 &&
    email.trim().length > 0 &&
    passwordStrong &&
    passwordsMatch &&
    !loading;

  function validateUsername(value: string) {
    if (value && !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setUsernameError('3–20 characters: letters, numbers, underscores only.');
    } else {
      setUsernameError('');
    }
  }

  function validateEmail(value: string) {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Enter a valid email address.');
    } else {
      setEmailError('');
    }
  }

  function validateConfirm(value: string) {
    if (value && value !== password) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError('');
    }
  }

  // Ctrl+Enter global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) handleRegister();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function handleRegister() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(username.trim(), email.trim(), password);
      onSuccess(data.access_token, data.refresh_token);
    } catch (err: any) {
      const status = err?.response?.status;
      const message: string = err?.response?.data?.message ?? '';
      if (status === 409) {
        setError(
          message.toLowerCase().includes('email')
            ? 'Email address is already registered.'
            : 'Username is already taken.',
        );
      } else if (status === 400) {
        setError('Please check your details and try again.');
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={wordmarkStyle}>Cadence</div>
          <div style={subtitleStyle}>Create your account</div>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Username */}
          <div>
            <Input
              label="Username"
              placeholder="e.g. jane_doe"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              onBlur={() => validateUsername(username)}
              error={usernameError}
              helper="3–20 characters: letters, numbers, underscores"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          {/* Email */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            type="email"
            disabled={loading}
            autoComplete="email"
          />

          {/* Password + strength checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              isPassword
              disabled={loading}
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </div>

          {/* Confirm password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); validateConfirm(e.target.value); setError(null); }}
              isPassword
              error={confirmError}
              disabled={loading}
              autoComplete="new-password"
            />
            {passwordsMatch && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--success)' }}>
                  Passwords match
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={errorStyle}>
              <span role="alert">{error}</span>
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: 4 }}>
            <Button
              variant="primary"
              size="md"
              style={{ width: '100%', justifyContent: 'center' }}
              loading={loading}
              disabled={!canSubmit}
              type="submit"
              kbd="⌃↵"
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </div>
        </form>

        {/* ── Footer ── */}
        <div style={footerStyle}>
          <span style={{ color: 'var(--fg-2)', fontSize: 13 }}>
            Already have an account?
          </span>
          <button type="button" onClick={onNavigateLogin} style={linkBtnStyle}>
            Log in
          </button>
        </div>

        {/* Keyboard hint */}
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
  overflowY: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-page)',
  padding: '24px 16px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--bg-0)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 36px 32px',
  boxShadow: 'var(--shadow-md)',
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 36,
  lineHeight: 1,
  letterSpacing: '-0.03em',
  color: 'var(--fg-0)',
  marginBottom: 6,
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
  marginTop: 22,
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
