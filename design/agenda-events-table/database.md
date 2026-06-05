# Agenda Events Table — Database Schema Design

## Summary

This design introduces a **standalone `agenda_events` table** that owns its own event data, completely decoupled from the calendar `events` table. The design includes:

1. **agendas** table: Core agenda entity (unchanged from original design)
2. **agenda_events** table: Standalone task/event table, NOT a junction table
3. **events** table: Remains completely unchanged (no new columns, no agenda-specific logic)

All IDs are UUIDs, all timestamps are `timestamptz` with UTC, and all tables have `created_at` and `updated_at` fields.

---

## New Tables

### agendas

Stores agenda records. An agenda is a container for a group of related agenda events.

```sql
CREATE TABLE IF NOT EXISTS agendas (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_at             TIMESTAMPTZ NOT NULL,
    end_at               TIMESTAMPTZ NOT NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agendas_start_at ON agendas(start_at);
CREATE INDEX idx_agendas_status ON agendas(status);
CREATE INDEX idx_agendas_start_at_id ON agendas(start_at, id);
CREATE INDEX idx_agendas_deleted_at ON agendas(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER agendas_set_updated_at
    BEFORE UPDATE ON agendas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### Field Definitions

| Column | Type | Constraints | Default | Notes |
|--------|------|-----------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Globally unique agenda identifier |
| title | VARCHAR(255) | NOT NULL | — | Agenda name/heading (max 255 chars) |
| description | TEXT | — | NULL | Optional longer description |
| start_at | TIMESTAMPTZ | NOT NULL | — | Agenda start date/time; used for sorting ("now" onwards by default) |
| end_at | TIMESTAMPTZ | NOT NULL | — | Agenda end date/time; defines the time range this agenda covers |
| status | VARCHAR(50) | NOT NULL, CHECK IN (active, completed, cancelled) | 'active' | Agenda lifecycle state |
| deleted_at | TIMESTAMPTZ | — | NULL | Soft delete marker; NULL = not deleted, non-NULL = archived |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Record last update timestamp (maintained by trigger) |

#### Indexes

- **idx_agendas_start_at**: Supports queries filtering by start_at (default "future" queries)
- **idx_agendas_status**: Supports status-based filtering (active vs. completed vs. cancelled)
- **idx_agendas_start_at_id**: Composite index for cursor-based pagination (start_at ASC, id ASC)
- **idx_agendas_deleted_at**: Partial index for soft-delete filtering (WHERE deleted_at IS NULL)

---

### agenda_events

**Key Change**: This is a **first-class, standalone table** that owns its own event data. NOT a junction table linking to the `events` table.

An agenda event is a task or item that belongs to an agenda. It has its own title, description, time window, and status. Optionally, it can track its origin via `source_event_id` (if created from a calendar event), but this is informational only — NOT a required foreign key relationship.

```sql
CREATE TABLE IF NOT EXISTS agenda_events (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id            UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_at             TIMESTAMPTZ NOT NULL,
    end_at               TIMESTAMPTZ NOT NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    sort_order           INT DEFAULT 0,
    source_event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agenda_events_agenda_id ON agenda_events(agenda_id);
CREATE INDEX idx_agenda_events_agenda_id_start_at ON agenda_events(agenda_id, start_at);
CREATE INDEX idx_agenda_events_agenda_id_sort_order ON agenda_events(agenda_id, sort_order);
CREATE INDEX idx_agenda_events_status ON agenda_events(status);
CREATE INDEX idx_agenda_events_source_event_id ON agenda_events(source_event_id);

CREATE TRIGGER agenda_events_set_updated_at
    BEFORE UPDATE ON agenda_events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### Field Definitions

| Column | Type | Constraints | Default | Notes |
|--------|------|-----------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique agenda event identifier |
| agenda_id | UUID | NOT NULL, FK → agendas | — | Parent agenda; CASCADE delete |
| title | VARCHAR(255) | NOT NULL | — | Event title (max 255 chars). Owned by agenda event; can differ from source event |
| description | TEXT | — | NULL | Optional event description. Independent of source event |
| start_at | TIMESTAMPTZ | NOT NULL | — | Event start time; used for sorting. Independent of source event |
| end_at | TIMESTAMPTZ | NOT NULL | — | Event end time. Independent of source event |
| status | VARCHAR(50) | NOT NULL, CHECK IN (active, completed, cancelled) | 'active' | Event lifecycle status within this agenda. Fully independent |
| sort_order | INT | — | 0 | Manual sort order for events within agenda (e.g., drag-and-drop reordering). Default 0 for natural order by start_at |
| source_event_id | UUID | FK → events (SET NULL on delete), nullable | NULL | If this agenda event was created from a calendar event, stores that event's ID. Purely informational; NOT a required relationship. Deletion of source event does NOT cascade |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Record last update timestamp |

#### Indexes

- **idx_agenda_events_agenda_id**: Supports "fetch all events for agenda X"
- **idx_agenda_events_agenda_id_start_at**: Composite index for paginated event queries sorted by time (high cardinality: agenda_id + start_at)
- **idx_agenda_events_agenda_id_sort_order**: Supports custom sort order retrieval within an agenda
- **idx_agenda_events_status**: Supports status-based filtering (active, completed, cancelled)
- **idx_agenda_events_source_event_id**: Supports reverse lookups; optional index for "find agenda events created from calendar event Y"

#### Cascade Behavior

- **ON DELETE CASCADE (agenda_id)**: Deleting an agenda removes all its agenda_events
- **ON DELETE SET NULL (source_event_id)**: Deleting a source calendar event sets the agenda event's `source_event_id` to NULL. The agenda event persists independently.

#### Key Design Decisions

1. **No UNIQUE constraint on (agenda_id, source_event_id)**: An agenda can contain multiple agenda events with the same source event (if user wants to add the same calendar event multiple times to one agenda, they can). Flexibility.

2. **status is VARCHAR, not ENUM**: Matches the pattern in the `agendas` table for consistency. Can be refactored to `ENUM` in Phase 2 if needed.

3. **start_at and end_at are required**: All agenda events have a time window (even all-day events). This simplifies querying for "events in time range".

4. **source_event_id is nullable and non-cascading**: Allows agenda events created entirely from scratch. Allows source calendar events to be deleted without affecting the agenda event.

---

## Unchanged Tables

### events

**NO CHANGES**. The `events` table remains completely unchanged. No agenda-specific columns are added.

The existing schema continues to support:
- Calendar events with all scheduling metadata
- Reminders, tags, recurrence
- Independent completion/cancellation status (`isCompleted`, no `isCancelled` in this context)

```sql
-- events table (from V3__create_events.sql and subsequent migrations)
-- Remains unchanged. Example structure (not repeated in full here):
-- - id (UUID)
-- - title, description, startAt, endAt, allDay
-- - userId, reminderMinutesBefore, tag
-- - isCompleted
-- - recurrence fields
-- - created_at, updated_at
```

**Rationale**: Calendar events and agenda events are two separate domains. Agenda events own their own status and metadata. No shared state or cross-cutting concerns.

---

## Flyway Migration Files

### Proposed Migration Numbers

After V8 (recurring events support), add:

```
V9__create_agendas_table.sql
V10__create_agenda_events_table.sql
```

(No V11 — events table is not modified)

### V9__create_agendas_table.sql

```sql
-- V9__create_agendas_table.sql
-- Creates the agendas table: top-level container for agenda events

CREATE TABLE IF NOT EXISTS agendas (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_at             TIMESTAMPTZ NOT NULL,
    end_at               TIMESTAMPTZ NOT NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agendas_start_at ON agendas(start_at);
CREATE INDEX idx_agendas_status ON agendas(status);
CREATE INDEX idx_agendas_start_at_id ON agendas(start_at, id);
CREATE INDEX idx_agendas_deleted_at ON agendas(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER agendas_set_updated_at
    BEFORE UPDATE ON agendas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### V10__create_agenda_events_table.sql

```sql
-- V10__create_agenda_events_table.sql
-- Creates the agenda_events table: standalone tasks/items within agendas
-- NOT a junction table; owns its own data (title, description, times, status)
-- Optional source_event_id links to calendar events (informational, not required)

CREATE TABLE IF NOT EXISTS agenda_events (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id            UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_at             TIMESTAMPTZ NOT NULL,
    end_at               TIMESTAMPTZ NOT NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    sort_order           INT DEFAULT 0,
    source_event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agenda_events_agenda_id ON agenda_events(agenda_id);
CREATE INDEX idx_agenda_events_agenda_id_start_at ON agenda_events(agenda_id, start_at);
CREATE INDEX idx_agenda_events_agenda_id_sort_order ON agenda_events(agenda_id, sort_order);
CREATE INDEX idx_agenda_events_status ON agenda_events(status);
CREATE INDEX idx_agenda_events_source_event_id ON agenda_events(source_event_id);

CREATE TRIGGER agenda_events_set_updated_at
    BEFORE UPDATE ON agenda_events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## TypeORM Entity Mapping

### AgendaEventStatus Enum

Create new enum file:

```typescript
// backend/src/agendas/enums/agenda-event-status.enum.ts
export enum AgendaEventStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

Export from barrel:

```typescript
// backend/src/agendas/enums/index.ts
export { AgendaEventStatus } from './agenda-event-status.enum';
```

### Agenda Entity

```typescript
// backend/src/agendas/entities/agenda.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgendaEvent } from './agenda-event.entity';

export enum AgendaStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('agendas')
export class Agenda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({
    type: 'enum',
    enum: AgendaStatus,
    default: AgendaStatus.ACTIVE,
  })
  status: AgendaStatus;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationship: one agenda has many agenda events
  @OneToMany(() => AgendaEvent, (agendaEvent) => agendaEvent.agenda, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  agendaEvents: AgendaEvent[];
}
```

### AgendaEvent Entity

```typescript
// backend/src/agendas/entities/agenda-event.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agenda } from './agenda.entity';
import { AgendaEventStatus } from '../enums';

@Entity('agenda_events')
export class AgendaEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agenda_id', type: 'uuid' })
  agendaId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({
    type: 'enum',
    enum: AgendaEventStatus,
    default: AgendaEventStatus.ACTIVE,
  })
  status: AgendaEventStatus;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'source_event_id', type: 'uuid', nullable: true })
  sourceEventId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Agenda, (agenda) => agenda.agendaEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agenda_id' })
  agenda: Agenda;

  // Optional relationship to source calendar event (for reference only)
  // No cascade; source event deletion does NOT delete the agenda event
  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_event_id' })
  sourceEvent: Event | null;
}
```

---

## Query Patterns & Performance Considerations

### High-Priority Queries

#### 1. Fetch agendas (future, paginated)
```sql
SELECT * FROM agendas 
WHERE start_at >= $1 AND deleted_at IS NULL 
ORDER BY start_at ASC, id ASC 
LIMIT $2 OFFSET $3;
```
- **Index**: `idx_agendas_start_at_id` (composite)
- **Use case**: Initial load of agenda list (forward direction)

#### 2. Fetch agendas (past, paginated)
```sql
SELECT * FROM agendas 
WHERE start_at < $1 AND deleted_at IS NULL 
ORDER BY start_at DESC, id DESC 
LIMIT $2 OFFSET $3;
```
- **Index**: `idx_agendas_start_at_id` (reverse scan)
- **Use case**: Loading past agendas (backward direction)

#### 3. Fetch agenda events (future, paginated)
```sql
SELECT * FROM agenda_events
WHERE agenda_id = $1 AND start_at >= $2
ORDER BY start_at ASC, id ASC
LIMIT $3 OFFSET $4;
```
- **Index**: `idx_agenda_events_agenda_id_start_at`
- **Use case**: List future events in an agenda (default view)

#### 4. Fetch agenda events (past, paginated)
```sql
SELECT * FROM agenda_events
WHERE agenda_id = $1 AND start_at < $2
ORDER BY start_at DESC, id DESC
LIMIT $3 OFFSET $4;
```
- **Index**: `idx_agenda_events_agenda_id_start_at` (reverse scan)
- **Use case**: Load past events within an agenda

#### 5. Fetch agenda with all metadata (for detail view)
```sql
SELECT * FROM agendas WHERE id = $1 AND deleted_at IS NULL;
```
- **Index**: Primary key lookup (PK always fast)
- **Use case**: Agenda detail screen

#### 6. Fetch agenda event for edit/view
```sql
SELECT * FROM agenda_events WHERE id = $1 AND agenda_id = $2;
```
- **Index**: Primary key lookup (PK)
- **Use case**: Get single agenda event

#### 7. Fetch agenda events by status (optional filter)
```sql
SELECT * FROM agenda_events
WHERE agenda_id = $1 AND status = $2 AND start_at >= $3
ORDER BY start_at ASC
LIMIT $4 OFFSET $5;
```
- **Indexes**: `idx_agenda_events_agenda_id_start_at`, `idx_agenda_events_status`
- **Use case**: Filter events by status within agenda

#### 8. Fetch agenda events created from source calendar event
```sql
SELECT * FROM agenda_events
WHERE source_event_id = $1
ORDER BY created_at DESC;
```
- **Index**: `idx_agenda_events_source_event_id`
- **Use case**: Find all agenda events linked to a calendar event (rare, informational)

### N+1 Prevention

- Use TypeORM eager loading with `.leftJoinAndSelect()` or explicit `.innerJoinAndSelect()` when fetching agendas with their events
- Avoid querying event details in loops; prefer batch queries
- Example:
  ```typescript
  const agenda = await this.agendaRepo.findOne({
    where: { id: agendaId },
    relations: ['agendaEvents'], // Eager load events
  });
  ```

### Soft Delete Strategy

- All "active" agenda queries use `WHERE deleted_at IS NULL`
- Partial index `idx_agendas_deleted_at` ensures soft-deleted agendas don't clutter queries
- Future: Implement scheduled cleanup job or archive table if soft-deleted agendas accumulate

### Query Performance Notes

- `start_at` is the primary sort key for agendas and agenda events
- Composite index `(agenda_id, start_at)` is crucial for nested pagination (agenda → events within agenda)
- Consider stats/ANALYZE if queries become slow with large datasets (1M+ agendas/events)

---

## Backward Compatibility

- **Existing event table remains unchanged**: All existing queries, migrations, and business logic continue to work
- **Zero impact on calendar events**: No columns added, no schema mutations
- **New agenda feature is purely additive**: Entirely new tables and APIs
- **No data migration needed**: Fresh deployment runs V9 and V10 migrations; existing deployments skip if already applied

---

## Indexes Summary Table

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| agendas | idx_agendas_start_at | (start_at) | Standard | Filter by start time |
| agendas | idx_agendas_status | (status) | Standard | Filter by status |
| agendas | idx_agendas_start_at_id | (start_at, id) | Composite | Cursor-based pagination |
| agendas | idx_agendas_deleted_at | (deleted_at) WHERE deleted_at IS NULL | Partial | Soft-delete filtering |
| agenda_events | idx_agenda_events_agenda_id | (agenda_id) | Standard | Fetch events for agenda |
| agenda_events | idx_agenda_events_agenda_id_start_at | (agenda_id, start_at) | Composite | Pagination within agenda |
| agenda_events | idx_agenda_events_agenda_id_sort_order | (agenda_id, sort_order) | Composite | Custom sort retrieval |
| agenda_events | idx_agenda_events_status | (status) | Standard | Filter by status |
| agenda_events | idx_agenda_events_source_event_id | (source_event_id) | Standard | Reverse lookup (optional) |

---

## Future Schema Considerations

1. **Soft delete on agenda_events?**
   - Likely not needed for MVP; direct deletion is acceptable
   - If audit trail becomes critical, add `deleted_at` in Phase 2

2. **Denormalized fields on agenda_events?**
   - Consider denormalizing `agenda_id` on agenda_events for performance (already done — agenda_id is explicitly stored as FK)
   - Consider denormalizing `agenda_title` if agenda events display parent agenda title frequently (defer to Phase 2 if needed)

3. **JSONB metadata column?**
   - For custom fields or agenda-event-specific attributes
   - Defer to Phase 2; MVP keeps schema simple

4. **Event attachments or links?**
   - Agenda events might support links to external resources, files, etc.
   - Defer; out of scope for MVP

5. **Recurrence for agenda events (Phase 3?)**
   - Repeating agenda events (e.g., recurring standups)
   - Would require similar recurrence model as calendar events
   - Significant complexity; defer to Phase 3

6. **Custom fields or user-defined properties (Phase 2+)?**
   - JSONB column for flexibility without schema changes
   - E.g., `custom_data: { priority: 'high', assignee: 'john@example.com' }`

---

## Testing Data / Seed Examples

For local development and testing, consider seeding with:

```sql
-- Example: Create test agenda
INSERT INTO agendas (title, description, start_at, end_at, status)
VALUES (
  'Q2 Planning Review',
  'Quarterly review with team',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days 8 hours',
  'active'
);

-- Example: Create test agenda events
INSERT INTO agenda_events (agenda_id, title, description, start_at, end_at, status, sort_order)
VALUES (
  '<agenda-id>',
  'Financial review',
  'Review Q2 spending and budget',
  NOW() + INTERVAL '7 days 09:00:00',
  NOW() + INTERVAL '7 days 10:00:00',
  'active',
  0
);
```
