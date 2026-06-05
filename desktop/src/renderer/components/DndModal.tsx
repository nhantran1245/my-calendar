import React, { useEffect, useRef, useState } from 'react';
import { notificationsApi } from '../api/notifications';
import { DND_MAX_MINUTES, DND_MIN_MINUTES } from '../constants/notification.constants';

const QUICK_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: 'Until tomorrow', minutes: 1440 },
];

interface Props {
  isActive: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function DndModal({ isActive, onClose, onChanged }: Props) {
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function enable(minutes: number) {
    setError(null);
    setLoading(true);
    try {
      await notificationsApi.enableDnd(minutes);
      onChanged();
    } catch {
      setError('Failed to enable Do Not Disturb.');
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setError(null);
    setLoading(true);
    try {
      await notificationsApi.disableDnd();
      onChanged();
    } catch {
      setError('Failed to disable Do Not Disturb.');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(customInput, 10);
    if (isNaN(mins) || mins < DND_MIN_MINUTES || mins > DND_MAX_MINUTES) {
      setError(`Enter a number between ${DND_MIN_MINUTES} and ${DND_MAX_MINUTES}.`);
      return;
    }
    enable(mins);
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-0)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 24,
          width: 380,
          zIndex: 201,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--fg-0)' }}>
            Do Not Disturb
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-2)',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {isActive && (
          <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
            Do Not Disturb is currently active.
          </p>
        )}

        {/* Quick options */}
        <p style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-sans)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Mute for
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => enable(opt.minutes)}
              disabled={loading}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                color: 'var(--fg-0)',
                transition: 'background 0.12s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom duration */}
        <p style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-sans)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Custom (minutes)
        </p>
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            ref={inputRef}
            type="number"
            min={DND_MIN_MINUTES}
            max={DND_MAX_MINUTES}
            placeholder="e.g. 90"
            value={customInput}
            onChange={(e) => { setCustomInput(e.target.value); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              background: 'var(--bg-1)',
              color: 'var(--fg-0)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !customInput}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !customInput ? 0.5 : 1,
            }}
          >
            Apply
          </button>
        </form>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {isActive && (
          <button
            onClick={disable}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--danger)',
              borderRadius: 8,
              color: 'var(--danger)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Disable Do Not Disturb
          </button>
        )}
      </div>
    </>
  );
}
