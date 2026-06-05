# Agenda Feature Design Overview

## Feature Summary

The **Agenda** feature provides a time-forward view of upcoming agendas and their associated events. Users can browse agendas starting from the current moment, scroll back to view past agendas, and drill into each agenda to see its events with the ability to change event status (completed, cancelled) or edit event details.

## Problem Being Solved

Users need a **focused, chronological view** of their upcoming tasks and plans without the month/calendar-grid interface. The agenda feature surfaces:

1. **Upcoming agendas**: A prioritized list of agendas sorted by start time, defaulting to "now and forward"
2. **Ability to review past agendas**: With a scroll-up gesture/action, users can inspect what they had scheduled
3. **Event management within an agenda**: Users can mark events complete or cancel them directly from the agenda detail view
4. **Server-side pagination**: No full data loads; all list operations are paginated to handle large datasets efficiently

## Core User Flows

1. **Browse upcoming agendas (default view)**
   - User opens Agenda screen
   - Screen shows agendas from current time onward (paginated)
   - User can scroll down to load more future agendas
   - Infinite scroll or "Load more" button fetches next page

2. **Review past agendas**
   - User pulls/scrolls upward on the agenda list
   - Screen loads agendas before the current time (paginated backward)
   - User reviews past agenda details

3. **View agenda details and manage events**
   - User taps an agenda in the list
   - Agenda detail screen shows:
     - Agenda metadata (title, date range, description)
     - Embedded list of events (also paginated, future by default)
     - Ability to scroll up within event list to see past events of that agenda
     - Edit button for agenda (edit title, description)
     - Status change button for agenda (if applicable)
   
4. **Manage event status within an agenda**
   - User taps event in the event list (within agenda detail)
   - Can mark as completed or cancelled
   - Status updates sync to server and reflect immediately in UI

## Acceptance Criteria

| Criterion | Details |
|-----------|---------|
| **Default view** | Agendas list shows future items by default (startAt >= now) |
| **Backward scroll** | Pulling up loads past agendas (startAt < now), paginated |
| **Server-side pagination** | No bulk fetch; all list endpoints use cursor-based or offset-based pagination |
| **Agenda detail screen** | Shows agenda metadata + embedded event list (also paginated, future by default) |
| **Event status management** | Events support: active, completed, cancelled statuses; changes sync immediately |
| **Edit capability** | Users can edit agenda title/description and event details from detail screen |
| **Responsive** | Mobile (Expo) and Desktop (Electron) both support the same interactions |
| **Empty states** | Clear messaging when no future agendas exist or past agendas have loaded |

## Scope: In

- **Agenda entity**: New table with title, description, startAt, endAt, status
- **Agenda ↔ Events relationship**: Each agenda has many events; events belong to one agenda
- **List endpoints**: 
  - GET /api/agendas (paginated, future by default, with ability to fetch past)
  - GET /api/agendas/:id/events (paginated event list for an agenda)
- **Detail endpoints**:
  - GET /api/agendas/:id (fetch single agenda with metadata)
  - PATCH /api/agendas/:id (edit agenda)
  - PATCH /api/events/:id/status (update event status within agenda)
- **Mobile UI**: Agenda list screen + Agenda detail screen with embedded event list
- **Desktop UI**: Agenda list screen + Agenda detail screen with embedded event list
- **Pagination strategy**: Cursor-based (using sortAt + id for stable cursor) or offset-based for simplicity

## Scope: Out

- **Agenda templates or recurring agendas** (future phase)
- **Agenda sharing or collaboration** (future phase)
- **Bulk event status changes** (future phase)
- **Agenda reminders** (beyond initial scope; reminder system exists for events)
- **Agenda search/filter** (Phase 2)
- **Agenda export/calendar integration** (future phase)

## Data Model Overview

### New Tables
- **agendas**: Core agenda entity (title, description, startAt, endAt, status, createdAt, updatedAt)
- **agenda_events**: Association table linking agendas to events (agenda_id, event_id)

### Modified Tables
- **events**: May add optional `agenda_id` foreign key if denormalizing for query performance (TBD in Phase 1 implementation)

## Dependencies on Existing Modules

| Module | Dependency | Details |
|--------|-----------|---------|
| **events** | Existing event entity and CRUD | Agenda contains events; event status changes align with existing isCompleted logic but extend to include cancelled status |
| **reminders** | Existing reminder cron | Future: agendas may integrate with reminder system for agenda-level alerts |
| **Flyway migrations** | Existing migration framework | New migrations for agenda tables (V9, V10, etc.) |

## Technical Constraints & Assumptions

- **UUID primary keys**: All new entities use UUID
- **Timestamps**: All tables have created_at, updated_at with UTC timezone
- **Pagination**: Server-side only; clients request pages, not all data
- **Status fields**: 
  - Agenda: `status` enum (active, completed, cancelled) — matches events pattern
  - Event: Reuse existing `isCompleted` boolean + new `isCancelled` boolean
- **Soft deletes**: TBD; likely use `deleted_at` if archival is needed
- **No hardcoding**: Constants/enums for pagination limits, default sort order, status values (per `.claude/rules/no-hardcode.md`)

## API Versioning & Consistency

All agenda endpoints follow existing event API patterns:
- Prefix: `/api/agendas`
- DTOs with class-validator validation
- Standard error responses (400, 404, 409, 500)
- Swagger/OpenAPI documentation

## Future Phases (Out of Scope for MVP)

- **Phase 2**: Agenda search, filtering by tag, advanced sorting
- **Phase 3**: Agenda templates, bulk operations, bulk exports
- **Phase 4**: Collaboration, sharing, team agendas
