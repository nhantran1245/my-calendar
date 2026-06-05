---
name: Agenda Events Table Redesign (vs. Junction Table)
description: Standalone agenda_events table design with copy-on-write semantics, replacing original junction table approach
type: project
---

**Completed 2026-06-04**: Redesigned agenda data model from junction table (linking agendas → events) to standalone `agenda_events` table with own event data.

**Key Decision**: Instead of `agenda_events` mapping many-to-many between agendas and calendar events, `agenda_events` is now a first-class table that owns its own data (title, description, startAt, endAt, status).

**Why**: The original junction table approach pushed agenda-specific logic into the shared `events` table, causing overload. Standalone table provides clean separation of concerns.

**How to apply**:
- Agenda events are fully independent; editing one doesn't affect source calendar events
- Optional `source_event_id` (nullable FK) tracks origin if created from calendar event, but deletion of source doesn't cascade
- No `is_cancelled` column added to events table (managed by agenda_events.status instead)
- Flyway migrations: V9 (agendas), V10 (agenda_events); no V11 (no events mutations)
- All new design docs in `design/agenda-events-table/` directory

**Design docs**: overview.md (rationale + scope), database.md (schema + TypeORM), api.yml (OpenAPI), ui-ux.md (screens + flows)
