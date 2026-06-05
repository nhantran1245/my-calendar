/**
 * DeleteConfirmModal — confirm deletion of a calendar event.
 */

import React, { useCallback, useEffect, useState } from 'react';

export interface DeleteConfirmModalProps {
  eventTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  eventTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }, [onConfirm]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1002,
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete Event"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1003,
          width: 300,
          background: 'var(--bg-0)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Title */}
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--fg-0)',
            letterSpacing: '-0.01em',
          }}
        >
          Delete Event?
        </h2>

        {/* Message */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--fg-1)',
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete &ldquo;{eventTitle}&rdquo;? This cannot be undone.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              color: 'var(--fg-1)',
              background: 'var(--bg-0)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: deleting ? 'default' : 'pointer',
              opacity: deleting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              color: '#fff',
              background: deleting ? 'rgba(122,53,51,0.5)' : '#7A3533',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: deleting ? 'default' : 'pointer',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  );
}
