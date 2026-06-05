import { fetchEventSource } from '@microsoft/fetch-event-source';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEFAULT_API_URL } from '../constants/api.constants';
import { NOTIFICATION_SSE_RECONNECT_DELAY_MS, NOTIFICATIONS_DEFAULT_PAGE_SIZE } from '../constants/notification.constants';
import { Notification, notificationsApi } from '../api/notifications';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  dndActive: boolean;
  loading: boolean;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  setDndActive: (active: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
  accessToken,
}: {
  children: React.ReactNode;
  accessToken: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dndActive, setDndActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, countRes, dndRes] = await Promise.all([
        notificationsApi.list({ take: NOTIFICATIONS_DEFAULT_PAGE_SIZE }),
        notificationsApi.unreadCount(),
        notificationsApi.dndStatus(),
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.unreadCount);
      setDndActive(dndRes.isActive);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // SSE — always connected while authenticated
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
    const url = `${apiBase}/notifications/stream`;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      fetchEventSource(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: ctrl.signal,
        onmessage(ev) {
          if (!ev.data) return;
          try {
            const notification: Notification = JSON.parse(ev.data);
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((c) => c + 1);
            const title = notification.event?.title ?? 'Reminder';
            window.electronAPI?.sendNotification(title, `Reminder: ${title}`);
          } catch {
            // ignore malformed events
          }
        },
        onerror() {
          ctrl.abort();
          reconnectTimer = setTimeout(connect, NOTIFICATION_SSE_RECONNECT_DELAY_MS);
        },
      });
    }

    connect();

    return () => {
      abortRef.current?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [accessToken]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await notificationsApi.dismiss(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const dismissAll = useCallback(async () => {
    await notificationsApi.dismissAll();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, dndActive, loading, load, markRead, dismiss, dismissAll, setDndActive }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
