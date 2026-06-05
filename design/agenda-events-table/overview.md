# Agenda Events Table — Feature Redesign

## Executive Summary

The original agenda design used `agenda_events` as a **junction table** linking `agendas` to calendar `events` (many-to-many). This approach pushes agenda-specific concerns (status, completion tracking, cancellation) into the shared `events` table, overloading it with logic that spans two distinct domains: calendar events and agenda tasks.

This redesign introduces `agenda_events` as a **first-class, standalone table** with its own event data. An agenda event is a task or item owned entirely by an agenda — not a reference to a calendar event. This completely decouples the two domains:

- **Calendar events** (`events` table): Remain focused on scheduling, reminders, recurrence, and tags. No agenda-specific columns.
- **Agenda events** (`agenda_events` table): Own status (active, completed, cancelled), ordering, optional title/description overrides, and optional origin tracking via `source_event_id`.

The separation of concerns simplifies business logic, eliminates cross-cutting concerns, and enables cleaner feature development.

---

## Problem with the Original Design

### Junction Table Approach (Before)

```
agendas ←─────────→ agenda_events ←─────────→ events
                     (junction)
```

**Issues:**
1. **Agenda-specific logic in events table**: Columns like `is_cancelled` added to `events` table, which is meant for calendar events, not agenda items
2. **Confusing status semantics**: An event can be "completed" for a user's calendar but also "cancelled" in an agenda context — two independent states that conflict
3. **Data coupling**: Deleting an event from a calendar also cascades to agendas, creating unexpected side effects
4. **Scalability**: As agenda features grow (custom ordering, custom titles, agenda-specific metadata), the events table becomes a dumping ground
5. **Logic bloat**: Service layer must handle parallel state management for both `isCompleted` and `isCancelled` across two contexts

### Standalone Table Approach (This Redesign)

```
agendas ←─→ agenda_events  (fully independent)
events ←─→ (remains unchanged)
```

**Benefits:**
1. **Clear separation**: `events` table focuses entirely on calendar events; `agenda_events` table owns agenda tasks
2. **Independent status lifecycle**: An agenda event's status is managed separately from any source calendar event
3. **No cross-table contamination**: Calendar events remain unaffected by agenda operations
4. **Future-proof**: Adding agenda-specific features (custom sorting, inline editing, bulk operations) doesn't clutter the core events model
5. **Optional linking**: `source_event_id` enables "add from calendar" functionality without requiring a permanent, coupled relationship

---

## What Changed vs. Original Design

### Removed
- **Deletion of junction table approach**: No more `agenda_events` mapping to `events` with a foreign key
- **`is_cancelled` column from events table**: No longer needed; agenda events handle their own status

### Added
- **Standalone `agenda_events` table**: Own columns for `id`, `title`, `description`, `start_at`, `end_at`, `status`, `sort_order`, `created_at`, `updated_at`
- **Optional `source_event_id` column**: Foreign key to `events` table (nullable, non-cascading). Allows agenda events created from calendar events to maintain a record of origin, but deletion of the source event does NOT delete the agenda event
- **Enum for `AgendaEventStatus`**: `ACTIVE`, `COMPLETED`, `CANCELLED` — owned entirely by agenda_events

### Modified
- **Events entity remains unchanged**: No columns added, no agenda-specific logic
- **Flyway migrations**: V9 creates `agendas`, V10 creates `agenda_events` (new standalone table), no V11 (no events mutation)

---

## Core User Flows (Unchanged)

User stories remain the same; implementation mechanics change:

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
     - Embedded list of agenda events (also paginated, future by default)
     - Ability to scroll up within event list to see past events of that agenda
     - Edit button for agenda (edit title, description)
     - Status change button for agenda (if applicable)
   
4. **Manage event status within an agenda**
   - User taps event in the event list (within agenda detail)
   - Can mark as completed or cancelled
   - Status updates sync to server and reflect immediately in UI
   - **NEW: Can also create agenda event from scratch or "add from calendar event"**
     - If from scratch: Agenda event is entirely new, standalone task
     - If from calendar event: Creates agenda event with optional `source_event_id` linking to the calendar event (copy-on-write semantics)

---

## Key Design Principles

### 1. Copy-on-Write Semantics
When a user "adds a calendar event to an agenda," the system:
1. **Does not** create a foreign key relationship
2. **Does** create a new `agenda_events` row with title/time copied from the source event
3. **Stores** the source event's ID in `source_event_id` (optional, informational)
4. **Allows** the agenda event to be edited independently — changes don't affect the source event
5. **Allows** the source event to be deleted without cascading to the agenda event

Result: Agenda events are decoupled from calendar events, but users have a way to track the origin.

### 2. Status Ownership
- **`agenda_events.status`** (ACTIVE, COMPLETED, CANCELLED) is owned by the agenda and managed entirely by agenda APIs
- **Calendar event status** (`events.isCompleted`, `events.isCancelled`) remains independent and managed by event APIs
- No bidirectional syncing or cross-cutting concerns

### 3. Immutable Origin
- `source_event_id` is set at creation time and never changes
- Provides an audit trail: "this agenda event originated from calendar event X"
- If source event is deleted, `source_event_id` becomes a stale reference (allowed; agenda event persists)

---

## Scope: In

- **Agenda entity**: New table with title, description, startAt, endAt, status (unchanged from original design)
- **Standalone Agenda Event entity**: First-class table with own event data, NOT a junction table
  - Fields: `id`, `agenda_id`, `title`, `description`, `start_at`, `end_at`, `status`, `sort_order`, `source_event_id` (nullable), `created_at`, `updated_at`
- **API endpoints**:
  - Agenda CRUD: `GET /api/agendas`, `POST /api/agendas`, `GET /api/agendas/:id`, `PATCH /api/agendas/:id`, `DELETE /api/agendas/:id`
  - Agenda events: `GET /api/agendas/:id/events`, `POST /api/agendas/:id/events` (create new or from calendar), `GET /api/agendas/:agendaId/events/:eventId`, `PATCH /api/agendas/:agendaId/events/:eventId`, `DELETE /api/agendas/:agendaId/events/:eventId`
- **Mobile UI**: Agenda list screen + Agenda detail screen with embedded agenda event list
- **Desktop UI**: Agenda list screen + Agenda detail screen with embedded agenda event list
- **Pagination strategy**: Cursor-based (using `start_at` + `id` for stable cursor) or offset-based for simplicity

---

## Scope: Out

- **Agenda templates or recurring agendas** (future phase)
- **Agenda sharing or collaboration** (future phase)
- **Bulk event status changes** (future phase)
- **Agenda reminders** (beyond initial scope; reminder system exists for calendar events)
- **Agenda search/filter** (Phase 2)
- **Agenda export/calendar integration** (future phase)
- **Syncing agenda events back to calendar events** (by design: agenda events are independent)

---

## Architecture: High Level

### Data Model
```
┌─────────────┐
│   agendas   │
├─────────────┤
│ id (UUID)   │
│ title       │
│ description │
│ start_at    │
│ end_at      │
│ status      │
│ ...         │
└──────┬──────┘
       │ 1:N
       │
   has many
       │
┌──────▼──────────────────┐
│   agenda_events         │  ← Standalone table, NOT a junction
├─────────────────────────┤
│ id (UUID)               │
│ agenda_id (FK)          │
│ title                   │ ← Own data
│ description             │ ← Own data
│ start_at                │ ← Own data
│ end_at                  │ ← Own data
│ status                  │ ← Own lifecycle
│ sort_order              │ ← Ordering within agenda
│ source_event_id (FK, ?) │ ← Optional origin link
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌──────────────┐
│    events    │  ← Completely unchanged
├──────────────┤
│ id (UUID)    │
│ title        │
│ description  │
│ start_at     │
│ end_at       │
│ isCompleted  │
│ ... (no agenda cols)
└──────────────┘
```

### Request Flow
```
Client
  ↓
PUT /api/agendas/{id}/events
  ↓
AgendaEventsController
  ↓
AgendaEventsService
  ↓
AgendaEventsRepository
  ↓
agenda_events table
```

No interaction with `events` table unless the user explicitly creates an agenda event from a calendar event (in which case we read the source event, copy its data, and create a new agenda event row).

---

## Technical Constraints & Assumptions

- **UUID primary keys**: All entities use UUID
- **Timestamps**: All tables have `created_at`, `updated_at` with UTC timezone
- **Pagination**: Server-side only; clients request pages
- **Soft deletes**: Use `deleted_at` for agendas; hard delete for agenda_events (simpler, no audit needed initially)
- **No hardcoding**: Constants/enums for pagination limits, status values (per `.claude/rules/no-hardcode.md`)
- **Copy-on-write**: Agenda events are independent; no bidirectional sync with source events

---

## Implementation Readiness

Developers can implement this design end-to-end:

1. **Database**: Run Flyway migrations V9 (agendas) and V10 (agenda_events)
2. **Backend**: Create TypeORM entities, DTOs, controllers, services; no mutation to events
3. **Frontend**: Reuse UI design from original; swap junction table queries with standalone table queries
4. **Testing**: Unit tests for AgendaEventsService, integration tests for API endpoints, E2E tests for user flows

No architectural ambiguity; all tables, relationships, and APIs are fully specified.

---

## Future Considerations

1. **Bidirectional sync (Phase 3)?**
   - Allow user to "sync" an agenda event back to its source calendar event
   - Requires explicit user intent; not automatic
   - May involve conflict resolution if both have been edited

2. **Bulk operations (Phase 2?)**
   - Mark all events in an agenda as completed
   - Reorder multiple events
   - Bulk delete from agenda

3. **Agenda event templates (Phase 3?)**
   - Save an agenda as a template (frozen snapshot)
   - Clone template to create new agenda
   - Useful for recurring agendas (weekly standups, monthly reviews)

4. **Nested agendas or agenda groups (future)?**
   - Logical grouping of related agendas
   - Rare; defer until demand is clear

5. **Custom metadata on agenda events (Phase 2?)**
   - Custom fields, tags, priorities
   - Denormalized into JSONB column if needed
