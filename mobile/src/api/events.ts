import { apiClient } from './client';

export type EventTag = 'personal' | 'work' | 'health' | 'deadline';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceEndType = 'never' | 'after_occurrences' | 'on_date';
export type UpdateScope = 'this_only' | 'this_and_following' | 'all';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  pattern?: Record<string, unknown>;
  endType: RecurrenceEndType;
  endValue?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  reminderMinutesBefore: number | null;
  tag: EventTag;
  isCompleted: boolean;
  // recurrence
  recurringEventId: string | null;
  isRecurrenceTemplate: boolean;
  isRecurrenceOverride: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrencePattern: Record<string, unknown> | null;
  recurrenceEndType: RecurrenceEndType | null;
  recurrenceEndValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  reminderMinutesBefore?: number | null;
  tag?: EventTag;
}

export interface CreateRecurringEventPayload extends CreateEventPayload {
  recurrenceRule: RecurrenceRule;
}

export interface RecurringSeriesResponse {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  tag: EventTag;
  reminderMinutesBefore: number | null;
  recurrenceFrequency: RecurrenceFrequency;
  recurrencePattern: Record<string, unknown> | null;
  recurrenceEndType: RecurrenceEndType;
  recurrenceEndValue: string | null;
  nextOccurrenceAt: string | null;
  totalInstanceCount: number;
  remainingInstanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export const eventsApi = {
  listByMonth: (year: number, month: number, includeCompleted = true) =>
    apiClient
      .get<{ data: CalendarEvent[]; meta: { year: number; month: number; count: number } }>(
        '/events',
        { params: { year, month, includeCompleted } },
      )
      .then((r) => r.data),
  get: (id: string) => apiClient.get<CalendarEvent>(`/events/${id}`).then((r) => r.data),
  create: (payload: CreateEventPayload) =>
    apiClient.post<CalendarEvent>('/events', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateEventPayload>, scope?: UpdateScope) =>
    apiClient
      .patch<{ event: CalendarEvent; affectedInstanceCount: number | null }>(
        `/events/${id}`,
        payload,
        { params: scope ? { scope } : undefined },
      )
      .then((r) => r.data),
  toggleComplete: (id: string, isCompleted: boolean) =>
    apiClient
      .patch<CalendarEvent>(`/events/${id}/complete`, { isCompleted })
      .then((r) => r.data),
  remove: (id: string, scope?: UpdateScope) =>
    apiClient.delete(`/events/${id}`, { params: scope ? { scope } : undefined }),
};

export const recurringApi = {
  create: (payload: CreateRecurringEventPayload) =>
    apiClient
      .post<{ event: CalendarEvent; instancesCreated: number; instancesCreatedUntil: string }>(
        '/events/recurring',
        payload,
      )
      .then((r) => r.data),

  list: (params?: { limit?: number; offset?: number; frequency?: RecurrenceFrequency }) =>
    apiClient
      .get<{ data: RecurringSeriesResponse[]; total: number; limit: number; offset: number }>(
        '/events/recurring',
        { params },
      )
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<RecurringSeriesResponse>(`/events/recurring/${id}`).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    apiClient
      .patch<{ event: CalendarEvent; updatedInstanceCount: number }>(
        `/events/recurring/${id}`,
        payload,
      )
      .then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/events/recurring/${id}`),

  getInstances: (
    id: string,
    params?: { limit?: number; offset?: number; fromDate?: string; toDate?: string },
  ) =>
    apiClient
      .get<{ data: CalendarEvent[]; total: number; limit: number; offset: number }>(
        `/events/recurring/${id}/instances`,
        { params },
      )
      .then((r) => r.data),
};
