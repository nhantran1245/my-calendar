/**
 * Input — Cadence-styled labeled text input for desktop forms.
 * Supports password reveal, error state, and helper text.
 */

import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  isPassword?: boolean;
}

export function Input({ label, error, helper, isPassword, id, ...rest }: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  const borderColor = error
    ? 'var(--danger)'
    : focused
    ? 'var(--accent)'
    : 'var(--border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label
        htmlFor={inputId}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--fg-1)',
        }}
      >
        {label}
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          {...rest}
          id={inputId}
          type={isPassword && !revealed ? 'password' : 'text'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: 38,
            padding: '0 12px',
            paddingRight: isPassword ? 40 : 12,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--fg-0)',
            background: 'var(--bg-0)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            transition: 'border-color var(--dur-fast) var(--ease-out)',
            boxSizing: 'border-box',
          }}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 10,
              border: 'none',
              background: 'transparent',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--fg-2)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Eye icon inline — avoids import dependency */}
            {revealed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--danger)' }}>
          {error}
        </span>
      )}
      {!error && helper && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg-3)' }}>
          {helper}
        </span>
      )}
    </div>
  );
}
