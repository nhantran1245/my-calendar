import { NotificationStatus } from '../types/notification.types';
import { apiClient } from './client';

export interface Notification {
  id: string;
  eventId: string;
  event: { title: string; startAt: string } | null;
  status: NotificationStatus;
  sentAt: string | null;
  isRead: boolean;
  readAt: string | null;
  isDismissed: boolean;
  dismissedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  skip: number;
  take: number;
}

export interface DndStatus {
  isActive: boolean;
  dndUntil: string | null;
  remainingMinutes: number | null;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  totalRead: number;
  totalDismissed: number;
  successRate: number;
  readRate: number;
  dismissRate: number;
  averageTimeToReadSeconds: number | null;
}

export interface AnalyticsByDayEntry {
  date: string;
  sent: number;
  read: number;
  dismissed: number;
  failed: number;
}

export const notificationsApi = {
  list: (params?: {
    skip?: number;
    take?: number;
    includeDismissed?: boolean;
    status?: NotificationStatus;
    isRead?: boolean;
  }) =>
    apiClient
      .get<NotificationListResponse>('/notifications', { params })
      .then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  dismiss: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/dismiss`).then((r) => r.data),

  dismissAll: () =>
    apiClient
      .post<{ dismissedCount: number }>('/notifications/dismiss-all')
      .then((r) => r.data),

  unreadCount: () =>
    apiClient
      .get<{ unreadCount: number }>('/notifications/unread-count')
      .then((r) => r.data),

  enableDnd: (durationMinutes: number) =>
    apiClient
      .post<{ dndUntil: string; durationMinutes: number }>('/notifications/dnd', {
        durationMinutes,
      })
      .then((r) => r.data),

  disableDnd: () =>
    apiClient.delete<{ dndUntil: null }>('/notifications/dnd').then((r) => r.data),

  dndStatus: () =>
    apiClient.get<DndStatus>('/notifications/dnd/status').then((r) => r.data),

  analyticsSummary: (params?: { from?: string; to?: string }) =>
    apiClient
      .get<AnalyticsSummary>('/notifications/analytics/summary', { params })
      .then((r) => r.data),

  analyticsByDay: (params?: { from?: string; to?: string }) =>
    apiClient
      .get<{ data: AnalyticsByDayEntry[] }>('/notifications/analytics/by-day', {
        params,
      })
      .then((r) => r.data),
};
