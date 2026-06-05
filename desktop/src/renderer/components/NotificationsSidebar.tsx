import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../api/notifications';
import { DndModal } from './DndModal';

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  onClose: () => void;
}

export function NotificationsSidebar({ onClose }: Props) {
  const { notifications, unreadCount, dndActive, loading, markRead, dismiss, dismissAll, setDndActive, load } =
    useNotifications();
  const [showDndModal, setShowDndModal] = useState(false);

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <div
        style={{
          width: 320,
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-page)',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--fg-0)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 100,
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  padding: '1px 7px',
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowDndModal(true)}
              title={dndActive ? 'Do Not Disturb is ON' : 'Do Not Disturb'}
              style={{
                background: dndActive ? 'var(--accent-tint)' : 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: dndActive ? 'var(--accent)' : 'var(--fg-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {dndActive ? '🔕 DND' : '🔔'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--fg-2)',
                fontSize: 18,
                lineHeight: 1,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 13, padding: '24px 0' }}>
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 13, padding: '24px 0' }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: n.isRead ? 'var(--bg-0)' : 'var(--accent-tint)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: n.isRead ? 400 : 600,
                          color: 'var(--fg-0)',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.event?.title ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-sans)' }}>
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--accent)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: 'var(--fg-3)',
                          lineHeight: 1,
                          padding: '0 2px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '10px 16px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={dismissAll}
              style={{
                width: '100%',
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '7px',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--fg-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>

      {/* DND modal */}
      {showDndModal && (
        <DndModal
          isActive={dndActive}
          onClose={() => setShowDndModal(false)}
          onChanged={() => {
            setShowDndModal(false);
            load();
          }}
        />
      )}
    </>
  );
}
