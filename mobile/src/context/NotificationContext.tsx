import * as ExpoNotifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import EventSource from 'react-native-sse';
import { Notification, notificationsApi } from '../api/notifications';
import { usersApi } from '../api/users';
import { useAuth } from './AuthContext';
import { DEFAULT_API_URL, NOTIFICATION_SSE_RECONNECT_DELAY_MS, NOTIFICATIONS_DEFAULT_PAGE_SIZE } from '../constants';

// Show notification banners when app is in foreground
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  dndActive: boolean;
  loading: boolean;
  load: (silent?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  setDndActive: (active: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dndActive, setDndActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
    if (accessToken) load();
  }, [accessToken, load]);

  // Register for push notifications and send token to backend
  useEffect(() => {
    if (!accessToken) return;

    async function registerPushToken() {
      const { status: existing } = await ExpoNotifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await ExpoNotifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: ExpoNotifications.AndroidImportance.MAX,
          sound: 'default',
        });
      }

      const token = (await ExpoNotifications.getExpoPushTokenAsync()).data;
      await usersApi.savePushToken(token).catch(() => {});
    }

    registerPushToken();
  }, [accessToken]);

  // SSE — always connected while authenticated
  useEffect(() => {
    if (!accessToken) return;

    const apiBase = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
    const url = `${apiBase}/notifications/stream`;

    function connect() {
      const es = new EventSource(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: false,
        pollingInterval: 0,
      });

      es.addEventListener('message', (e) => {
        if (!e.data) return;
        try {
          const notification: Notification = JSON.parse(e.data);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((c) => c + 1);
        } catch {
          // ignore malformed events
        }
      });

      es.addEventListener('error', () => {
        es.close();
        setTimeout(connect, NOTIFICATION_SSE_RECONNECT_DELAY_MS);
      });

      sseRef.current = es;
    }

    connect();

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
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
