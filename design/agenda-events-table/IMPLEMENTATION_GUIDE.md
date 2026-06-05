# Agenda Events Table — Implementation Guide

## Quick Start

This folder contains the complete specification for the **agenda events table redesign**. Instead of using `agenda_events` as a junction table linking `agendas` to `events`, the new design makes `agenda_events` a **first-class, standalone table** with its own event data.

### Files in This Design

1. **overview.md** — Feature rationale, problem statement, scope, design principles
2. **database.md** — Schema (agendas, agenda_events), TypeORM entities, migrations (V9, V10), query patterns
3. **api.yml** — OpenAPI 3.0 specification for all endpoints
4. **ui-ux.md** — User interface screens, interactions, flows, accessibility
5. **IMPLEMENTATION_GUIDE.md** — This file; implementation roadmap and checklist

---

## Architecture Overview

### Data Model

```
┌──────────────┐           ┌────────────────────┐
│   agendas    │──1:N──→   │  agenda_events     │
│              │           │  (STANDALONE)      │
└──────────────┘           ├────────────────────┤
                           │ id (UUID)          │
                           │ title              │
                           │ description        │
                           │ start_at           │
                           │ end_at             │
                           │ status (enum)      │
                           │ sort_order         │
                           │ source_event_id (?)|
                           └────────────────────┘
                                    │
                                    ↓
                           ┌──────────────────┐
                           │     events       │
                           │  (UNCHANGED)     │
                           │  (optional link) │
                           └──────────────────┘
```

**Key Points**:
- `agenda_events` **owns its own data** (not a junction table)
- `source_event_id` is **optional, non-cascading** (for origin tracking if created from calendar event)
- `events` table remains **completely unchanged**
- No cross-table constraints that couple the two domains

---

## Implementation Roadmap

### Phase 1: MVP (Core Feature)

#### 1.1 Database
- [ ] Create and apply Flyway migration V9 (`create_agendas_table.sql`)
- [ ] Create and apply Flyway migration V10 (`create_agenda_events_table.sql`)
- [ ] Verify indexes are created and queries plan correctly

#### 1.2 Backend — Entities & DTOs
- [ ] Create `src/agendas/enums/agenda-status.enum.ts`
- [ ] Create `src/agendas/enums/agenda-event-status.enum.ts`
- [ ] Create `src/agendas/entities/agenda.entity.ts` (TypeORM)
- [ ] Create `src/agendas/entities/agenda-event.entity.ts` (TypeORM)
- [ ] Create DTOs for all endpoints:
  - `CreateAgendaDto`, `UpdateAgendaDto`
  - `CreateAgendaEventDto`, `UpdateAgendaEventDto`
  - `AgendaResponseDto`, `AgendaEventResponseDto` (with nested events, if applicable)

#### 1.3 Backend — Repositories & Services
- [ ] Create `src/agendas/repositories/agenda.repository.ts` (or use TypeORM repo directly)
- [ ] Create `src/agendas/repositories/agenda-event.repository.ts`
- [ ] Create `src/agendas/services/agenda.service.ts` with methods:
  - `listAgendas(limit, offset, direction, status, includeSoftDeleted)`
  - `getAgenda(id)`
  - `createAgenda(dto)`
  - `updateAgenda(id, dto)`
  - `deleteAgenda(id, permanent?)`
- [ ] Create `src/agendas/services/agenda-event.service.ts` with methods:
  - `listAgendaEvents(agendaId, limit, offset, direction, status)`
  - `getAgendaEvent(agendaId, eventId)`
  - `createAgendaEvent(agendaId, dto)` — supports both from-scratch and from-calendar modes
  - `updateAgendaEvent(agendaId, eventId, dto)`
  - `deleteAgendaEvent(agendaId, eventId)`
- [ ] Implement business logic:
  - Validate endAt >= startAt
  - Implement copy-on-write: if `sourceEventId` provided, fetch source event and copy title/times
  - Handle soft deletes correctly (filter `WHERE deleted_at IS NULL`)
  - Pagination: offset-based with `hasMore` calculation

#### 1.4 Backend — Controllers
- [ ] Create `src/agendas/controllers/agenda.controller.ts`:
  - `GET /api/agendas` (list)
  - `POST /api/agendas` (create)
  - `GET /api/agendas/:id` (detail)
  - `PATCH /api/agendas/:id` (update)
  - `DELETE /api/agendas/:id` (delete)
- [ ] Create `src/agendas/controllers/agenda-event.controller.ts`:
  - `GET /api/agendas/:id/events` (list)
  - `POST /api/agendas/:id/events` (create)
  - `GET /api/agendas/:agendaId/events/:eventId` (detail)
  - `PATCH /api/agendas/:agendaId/events/:eventId` (update)
  - `DELETE /api/agendas/:agendaId/events/:eventId` (delete)
- [ ] Apply `ValidationPipe` with DTOs (class-validator)
- [ ] Implement error handling:
  - 400 Bad Request (validation)
  - 404 Not Found (agenda/event doesn't exist)
  - 409 Conflict (if needed, e.g., sourceEventId not found)
  - 500 Internal Server Error

#### 1.5 Backend — Testing
- [ ] Unit tests for AgendaService (create, update, list, delete, soft-delete logic)
- [ ] Unit tests for AgendaEventService (create from scratch, create from calendar, update, status change)
- [ ] Integration tests for API endpoints (test full request→response cycle)
- [ ] Test pagination: offset calculation, hasMore flag, direction reversal
- [ ] Test copy-on-write: agenda event created from calendar event has sourceEventId set, data copied correctly

#### 1.6 Frontend — Mobile (Expo)
- [ ] Create `src/api/agenda-client.ts` (axios wrapper) with methods:
  - `listAgendas(limit, offset, direction)`
  - `getAgenda(id)`
  - `createAgenda(data)`
  - `updateAgenda(id, data)`
  - `deleteAgenda(id)`
  - `listAgendaEvents(agendaId, limit, offset, direction)`
  - `createAgendaEvent(agendaId, data)`
  - `updateAgendaEvent(agendaId, eventId, data)`
  - `deleteAgendaEvent(agendaId, eventId)`
- [ ] Create types/interfaces in `src/types/agenda.types.ts`:
  - `Agenda`, `AgendaEvent`, `CreateAgendaPayload`, `UpdateAgendaEventPayload`, etc.
- [ ] Create screens:
  - `src/screens/AgendaListScreen.tsx` — List of agendas (future/past, paginated)
  - `src/screens/AgendaDetailScreen.tsx` — Agenda detail + event list
  - `src/screens/CreateAgendaScreen.tsx` or modal — Create/edit agenda
  - `src/screens/CreateAgendaEventScreen.tsx` or modal — Create agenda event (two modes: from scratch, from calendar)
- [ ] Implement interactions:
  - Scroll-down pagination (future agendas)
  - Scroll-up pagination (past agendas) — explicit "Load past" button or threshold
  - Tap agenda → detail screen
  - Tap event status → quick change (optimistic update + PATCH)
  - Tap edit → edit modal
  - Pull-to-refresh (agenda list)
- [ ] Error handling and loading states (skeleton screens, toasts)

#### 1.7 Frontend — Desktop (Electron)
- [ ] Reuse `src/api/agenda-client.ts` (shared between mobile and desktop)
- [ ] Create components:
  - `src/renderer/components/AgendaList.tsx` — Sidebar list
  - `src/renderer/components/AgendaDetail.tsx` — Main detail pane
  - `src/renderer/components/AgendaEventList.tsx` — Event list within detail
  - `src/renderer/components/CreateAgendaModal.tsx`
  - `src/renderer/components/CreateAgendaEventModal.tsx`
- [ ] Implement desktop-specific interactions:
  - Keyboard navigation (Tab, Enter, Escape)
  - Right-click context menu on events
  - Hover state for action buttons
  - Responsive layout (detail pane collapses on narrow window)
- [ ] Error handling, loading states, accessibility

#### 1.8 E2E Tests
- [ ] Test user flow: Create agenda → List shows it → Tap to detail → Add agenda event from scratch → Mark as completed
- [ ] Test user flow: Create agenda event from calendar event → Verify copy-on-write behavior → Edit agenda event → Verify source event unaffected
- [ ] Test pagination: Load future agendas → Scroll down → Load more → Scroll up → Load past
- [ ] Test error scenarios: Network error, server error, not found

---

### Phase 2: Enhancements & Polish

- [ ] Agenda search/filter by title, date range, status
- [ ] Bulk operations: Mark all events in agenda as completed
- [ ] Reorder agenda events via drag-and-drop (use `sort_order` field)
- [ ] Bidirectional sync: Allow user to "sync" agenda event back to source calendar event (if sourceEventId exists)
- [ ] Recurring agenda templates
- [ ] Notifications when agenda event status changes (local notification or desktop IPC)
- [ ] Analytics: Track which agendas are most used, event completion rates

---

### Phase 3: Advanced Features

- [ ] Agenda sharing/collaboration
- [ ] Agenda export (PDF, CSV, calendar format)
- [ ] Custom fields/metadata on agenda events (JSONB column)
- [ ] Nested agendas or agenda groups
- [ ] Recurring agenda events (similar to calendar event recurrence)

---

## Implementation Checklist

Use this checklist as you implement:

### Database
- [ ] V9 migration applied (agendas table)
- [ ] V10 migration applied (agenda_events table)
- [ ] All indexes created and verified
- [ ] Soft delete logic in place (agendas.deleted_at, WHERE deleted_at IS NULL filters)

### Backend (NestJS)
- [ ] Enums for AgendaStatus, AgendaEventStatus
- [ ] Agenda entity with proper column mappings
- [ ] AgendaEvent entity with proper column mappings
- [ ] DTOs for all endpoints (Create, Update, Response)
- [ ] AgendaService with full CRUD + pagination logic
- [ ] AgendaEventService with full CRUD + copy-on-write for sourceEventId
- [ ] AgendaController with all endpoints
- [ ] AgendaEventController with all endpoints
- [ ] Validation pipes applied (class-validator)
- [ ] Error handling (404, 400, 409, 500)
- [ ] Unit tests (services, validation)
- [ ] Integration tests (API endpoints)

### Frontend (Mobile)
- [ ] Axios client setup (agenda-client.ts)
- [ ] Types/interfaces defined
- [ ] AgendaListScreen (future/past pagination, pull-to-refresh)
- [ ] AgendaDetailScreen (agenda metadata + event list)
- [ ] Create/Edit modals (agendas and agenda events)
- [ ] Status change interaction (optimistic update)
- [ ] Error states and loading states
- [ ] Tests (component, integration if applicable)

### Frontend (Desktop)
- [ ] Reuse agenda-client.ts
- [ ] AgendaList sidebar component
- [ ] AgendaDetail main pane component
- [ ] Modals for create/edit
- [ ] Keyboard navigation + accessibility
- [ ] Right-click context menu
- [ ] Responsive layout
- [ ] Tests

### E2E Tests
- [ ] Create agenda flow
- [ ] Create agenda event from scratch
- [ ] Create agenda event from calendar event (copy-on-write)
- [ ] Edit agenda event (verify source event unaffected)
- [ ] Delete agenda event (verify source event persists)
- [ ] Pagination (forward/backward)
- [ ] Error recovery

### Documentation
- [ ] Swagger/OpenAPI docs generated from code
- [ ] README or wiki page for agenda feature
- [ ] Developer guide for extending agenda feature (future)

---

## Code Style & Conventions

Adhere to project conventions:

- **Naming**: UUID ids, `camelCase` properties with `snake_case` columns
- **Constants/Enums**: No magic strings; use constants and enums (per `.claude/rules/no-hardcode.md`)
- **DTOs**: All controller input through `class-validator` DTOs with `ValidationPipe(whitelist: true)`
- **Timestamps**: Always `timestamptz` with UTC; use `createdAt`, `updatedAt`
- **Soft deletes**: Use `deleted_at` on agendas; filter with `WHERE deleted_at IS NULL`
- **Status fields**: Use string enums (CHECK constraints in SQL) for easier migration in future

---

## Key Files by Feature

### Database
- `db/migrations/V9__create_agendas_table.sql`
- `db/migrations/V10__create_agenda_events_table.sql`

### Backend
- `backend/src/agendas/enums/agenda-status.enum.ts`
- `backend/src/agendas/enums/agenda-event-status.enum.ts`
- `backend/src/agendas/entities/agenda.entity.ts`
- `backend/src/agendas/entities/agenda-event.entity.ts`
- `backend/src/agendas/dtos/create-agenda.dto.ts`
- `backend/src/agendas/dtos/update-agenda.dto.ts`
- `backend/src/agendas/dtos/create-agenda-event.dto.ts`
- `backend/src/agendas/dtos/update-agenda-event.dto.ts`
- `backend/src/agendas/dtos/agenda.response.dto.ts`
- `backend/src/agendas/dtos/agenda-event.response.dto.ts`
- `backend/src/agendas/services/agenda.service.ts`
- `backend/src/agendas/services/agenda-event.service.ts`
- `backend/src/agendas/controllers/agenda.controller.ts`
- `backend/src/agendas/controllers/agenda-event.controller.ts`

### Mobile (Expo)
- `mobile/src/api/agenda-client.ts`
- `mobile/src/types/agenda.types.ts`
- `mobile/src/screens/AgendaListScreen.tsx`
- `mobile/src/screens/AgendaDetailScreen.tsx`
- `mobile/src/screens/CreateAgendaModal.tsx` (or part of detail screen)
- `mobile/src/screens/CreateAgendaEventModal.tsx` (or part of detail screen)

### Desktop (Electron)
- `desktop/src/renderer/components/AgendaList.tsx`
- `desktop/src/renderer/components/AgendaDetail.tsx`
- `desktop/src/renderer/components/AgendaEventList.tsx`
- `desktop/src/renderer/components/CreateAgendaModal.tsx`
- `desktop/src/renderer/components/CreateAgendaEventModal.tsx`

---

## Testing Strategy

### Unit Tests
- Services: CRUD operations, pagination logic, copy-on-write behavior
- DTOs: Validation (required fields, max length, date ordering)
- Enums: Correct values

### Integration Tests
- Full API request/response cycles
- Database operations (insert, update, delete, soft delete)
- Pagination (offset calculation, hasMore flag)
- Error responses (400, 404, 409)

### E2E Tests
- Entire user flow: Create agenda → Add events → Edit → Mark completed → Delete
- Cross-platform: Same flow on mobile and desktop
- Error scenarios: Network failure, server error

### Performance Tests (Phase 2)
- Query performance with large datasets (1M+ agendas/events)
- Pagination performance
- Index utilization verification

---

## Known Constraints & Decisions

1. **No cascading delete from events to agenda_events**: If a calendar event is deleted, the agenda_events row persists with `source_event_id = NULL`. This is intentional (copy-on-write semantics).

2. **Soft delete on agendas, hard delete on agenda_events**: Agendas can be recovered; agenda events are task-specific and typically not archived. (Can change in Phase 2 if audit trail needed.)

3. **Offset-based pagination for simplicity**: Cursor-based pagination can be added in Phase 2 for better performance with large datasets.

4. **No built-in filtering in Phase 1**: Status filtering is optional in list endpoints; full-text search deferred to Phase 2.

5. **Copy-on-write is explicit**: Editing an agenda event does NOT update the source calendar event; users must explicitly sync if needed (Phase 3).

---

## Questions & Support

For questions about the design:
- See `design/agenda-events-table/overview.md` for rationale and scope
- See `design/agenda-events-table/database.md` for schema details
- See `design/agenda-events-table/api.yml` for API contracts
- See `design/agenda-events-table/ui-ux.md` for user interactions

For questions about codebase conventions:
- See `CLAUDE.md` (project instructions)
- See `.claude/rules/no-hardcode.md` (constants and enums)

---

## Sign-Off

Design completed: **2026-06-04**

Specification status: **Ready for Implementation**

All design documents are implementation-ready. Developers should be able to implement end-to-end without requiring design clarifications (within MVP scope).
