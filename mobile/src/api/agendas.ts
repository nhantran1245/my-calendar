import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgendaStatus = 'active' | 'completed' | 'cancelled';
export type AgendaEventStatus = 'active' | 'completed' | 'cancelled';
export type PaginationDirection = 'forward' | 'backward';

export interface Agenda {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: AgendaStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaEvent {
  id: string;
  agendaId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: AgendaEventStatus;
  sortOrder: number;
  sourceEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface ListAgendasParams {
  limit?: number;
  offset?: number;
  direction?: PaginationDirection;
  status?: AgendaStatus;
}

export interface CreateAgendaPayload {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
}

export interface UpdateAgendaPayload {
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  status?: AgendaStatus;
}

export interface ListAgendaEventsParams {
  limit?: number;
  offset?: number;
  direction?: PaginationDirection;
}

export interface CreateAgendaEventPayload {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  sortOrder?: number;
  sourceEventId?: string | null;
}

export interface UpdateAgendaEventPayload {
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  status?: AgendaEventStatus;
  sortOrder?: number;
}

// ─── API client ───────────────────────────────────────────────────────────────

export const agendasApi = {
  list: (params?: ListAgendasParams) =>
    apiClient
      .get<PaginatedResponse<Agenda>>('/agendas', { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ data: Agenda }>(`/agendas/${id}`).then((r) => r.data.data),

  create: (payload: CreateAgendaPayload) =>
    apiClient.post<{ data: Agenda }>('/agendas', payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateAgendaPayload) =>
    apiClient
      .patch<{ data: Agenda }>(`/agendas/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/agendas/${id}`),

  listEvents: (agendaId: string, params?: ListAgendaEventsParams) =>
    apiClient
      .get<PaginatedResponse<AgendaEvent>>(`/agendas/${agendaId}/events`, { params })
      .then((r) => r.data),

  getEvent: (agendaId: string, eventId: string) =>
    apiClient
      .get<{ data: AgendaEvent }>(`/agendas/${agendaId}/events/${eventId}`)
      .then((r) => r.data.data),

  createEvent: (agendaId: string, payload: CreateAgendaEventPayload) =>
    apiClient
      .post<{ data: AgendaEvent }>(`/agendas/${agendaId}/events`, payload)
      .then((r) => r.data.data),

  updateEvent: (agendaId: string, eventId: string, payload: UpdateAgendaEventPayload) =>
    apiClient
      .patch<{ data: AgendaEvent }>(`/agendas/${agendaId}/events/${eventId}`, payload)
      .then((r) => r.data.data),

  removeEvent: (agendaId: string, eventId: string) =>
    apiClient.delete(`/agendas/${agendaId}/events/${eventId}`),
};
