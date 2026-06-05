/**
 * PasswordStrength — live checklist shown under the password field.
 */

import React from 'react';

interface Check {
  label: string;
  passes: (p: string) => boolean;
}

const CHECKS: Check[] = [
  { label: 'At least 8 characters',    passes: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', passes: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', passes: (p) => /[a-z]/.test(p) },
  { label: 'Contains a digit',          passes: (p) => /[0-9]/.test(p) },
];

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
      {CHECKS.map((check) => {
        const ok = check.passes(password);
        return (
          <div
            key={check.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: ok ? 'var(--success)' : 'var(--fg-3)',
              transition: 'color var(--dur-fast) var(--ease-out)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 12 }}>
              {ok ? '✓' : '–'}
            </span>
            {check.label}
          </div>
        );
      })}
    </div>
  );
}

export function passwordIsStrong(password: string): boolean {
  return CHECKS.every((c) => c.passes(password));
}
