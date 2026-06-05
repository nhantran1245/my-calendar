# Recurring Events Feature — Database Design

## New Tables & Schema Changes

### 1. RecurrenceRule Enum (PostgreSQL Type)

Define the supported recurrence patterns:

```sql
CREATE TYPE recurrence_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

CREATE TYPE recurrence_end_type AS ENUM (
  'never',
  'after_occurrences',
  'on_date'
);
```

## Modifications to Existing `events` Table

Add the following columns to support recurring event instances and tracking:

| Column | Type | Constraints | Default | Purpose |
|--------|------|-------------|---------|---------|
| `recurring_event_id` | UUID | FK → events(id), nullable | NULL | For instances: points to the series template; for templates: NULL |
| `recurrence_frequency` | recurrence_frequency | nullable, ENUM | NULL | Frequency: daily, weekly, monthly, yearly (template only) |
| `recurrence_pattern` | TEXT | nullable | NULL | JSON storing pattern details: for weekly = `{"days": ["mon", "wed", "fri"]}`, monthly = `{"type": "date", "value": 15}` or `{"type": "relative", "value": "2nd_tuesday"}`, yearly = same |
| `recurrence_end_type` | recurrence_end_type | nullable, ENUM | NULL | End condition type: never, after_occurrences, on_date |
| `recurrence_end_value` | TEXT | nullable | NULL | Stores the end value: for "after_occurrences" = `"52"`, for "on_date" = ISO8601 date string |
| `recurrence_generated_until` | TIMESTAMPTZ | nullable | NULL | Tracks how far instances have been generated (for lazy expansion) |
| `is_recurrence_template` | BOOLEAN | default FALSE | FALSE | TRUE for series templates; FALSE for single events and instances |
| `is_recurrence_override` | BOOLEAN | default FALSE | FALSE | TRUE if this instance deviates from the series template |
| `overridden_at` | TIMESTAMPTZ | nullable | NULL | When the override occurred (useful for audit/history) |

### Migration File: `V8__add_recurring_events_support.sql`

```sql
-- Create ENUM types for recurrence
CREATE TYPE recurrence_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

CREATE TYPE recurrence_end_type AS ENUM (
  'never',
  'after_occurrences',
  'on_date'
);

-- Add recurrence columns to events table
ALTER TABLE events
  ADD COLUMN recurring_event_id UUID,
  ADD COLUMN recurrence_frequency recurrence_frequency,
  ADD COLUMN recurrence_pattern JSONB,
  ADD COLUMN recurrence_end_type recurrence_end_type,
  ADD COLUMN recurrence_end_value TEXT,
  ADD COLUMN recurrence_generated_until TIMESTAMPTZ,
  ADD COLUMN is_recurrence_template BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_recurrence_override BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN overridden_at TIMESTAMPTZ;

-- Add foreign key constraint (self-referencing for recurringEventId)
ALTER TABLE events
  ADD CONSTRAINT fk_events_recurring_event_id
  FOREIGN KEY (recurring_event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Add indexes for efficient queries
CREATE INDEX idx_events_recurring_event_id ON events(recurring_event_id);
CREATE INDEX idx_events_is_recurrence_template ON events(is_recurrence_template);
CREATE INDEX idx_events_recurrence_frequency ON events(recurrence_frequency);
CREATE INDEX idx_events_is_recurrence_override ON events(is_recurrence_override);

-- Composite index for calendar queries filtering instances of a series
CREATE INDEX idx_events_recurring_event_start_at
  ON events(recurring_event_id, start_at)
  WHERE recurring_event_id IS NOT NULL;

-- Index for finding series templates
CREATE INDEX idx_events_template_user_start
  ON events(is_recurrence_template, start_at)
  WHERE is_recurrence_template = TRUE;
```

**Rationale:**
- `recurring_event_id` links instances back to their series template
- `recurrence_frequency` defines the repeat type (daily/weekly/monthly/yearly)
- `recurrence_pattern` stores JSON for flexibility (days of week, date patterns, etc.)
- `recurrence_end_type` and `recurrence_end_value` define termination conditions
- `is_recurrence_template` and `is_recurrence_override` distinguish templates from instances and overrides
- Composite indexes optimize calendar queries and series lookups

## Entity Changes

### Updated Event Entity (`event.entity.ts`)

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventTag } from './enums/event-tag.enum';
import { RecurrenceFrequency } from './enums/recurrence-frequency.enum';
import { RecurrenceEndType } from './enums/recurrence-end-type.enum';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ name: 'all_day', default: false })
  allDay: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, default: null })
  userId: string | null;

  @Column({ name: 'reminder_minutes_before', nullable: true, type: 'int' })
  reminderMinutesBefore: number | null;

  @Column({ type: 'enum', enum: EventTag, default: EventTag.PERSONAL })
  tag: EventTag;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  // ===== NEW: Recurring Event Fields =====

  @Column({ name: 'recurring_event_id', type: 'uuid', nullable: true })
  recurringEventId: string | null;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurring_event_id' })
  recurringEvent: Event | null;

  @Column({
    name: 'recurrence_frequency',
    type: 'enum',
    enum: RecurrenceFrequency,
    nullable: true,
  })
  recurrenceFrequency: RecurrenceFrequency | null;

  @Column({ name: 'recurrence_pattern', type: 'jsonb', nullable: true })
  recurrencePattern: Record<string, unknown> | null;

  @Column({
    name: 'recurrence_end_type',
    type: 'enum',
    enum: RecurrenceEndType,
    nullable: true,
  })
  recurrenceEndType: RecurrenceEndType | null;

  @Column({ name: 'recurrence_end_value', type: 'text', nullable: true })
  recurrenceEndValue: string | null;

  @Column({
    name: 'recurrence_generated_until',
    type: 'timestamptz',
    nullable: true,
  })
  recurrenceGeneratedUntil: Date | null;

  @Column({ name: 'is_recurrence_template', default: false })
  isRecurrenceTemplate: boolean;

  @Column({ name: 'is_recurrence_override', default: false })
  isRecurrenceOverride: boolean;

  @Column({ name: 'overridden_at', type: 'timestamptz', nullable: true })
  overriddenAt: Date | null;

  // ===== End Recurring Event Fields =====

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

### New Enums

**`backend/src/events/enums/recurrence-frequency.enum.ts`**
```typescript
export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
```

**`backend/src/events/enums/recurrence-end-type.enum.ts`**
```typescript
export enum RecurrenceEndType {
  NEVER = 'never',
  AFTER_OCCURRENCES = 'after_occurrences',
  ON_DATE = 'on_date',
}
```

## Query Patterns

### 1. Get All Recurring Event Templates (Series)

```sql
SELECT * FROM events
WHERE is_recurrence_template = TRUE
  AND (user_id = $1 OR user_id IS NULL)
ORDER BY start_at ASC;
```

**Purpose**: List view of active recurring series.

---

### 2. Get All Instances of a Recurring Series

```sql
SELECT * FROM events
WHERE recurring_event_id = $1
ORDER BY start_at ASC;
```

**Purpose**: View all occurrences of a single recurring event.

---

### 3. Get Instances for Calendar View (by Month)

```sql
SELECT * FROM events
WHERE (is_recurrence_template = FALSE OR recurring_event_id IS NOT NULL)
  AND DATE_TRUNC('month', start_at) = DATE_TRUNC('month', $1::timestamptz)
  AND (user_id = $2 OR user_id IS NULL)
ORDER BY start_at ASC;
```

**Purpose**: Calendar view shows instances, not templates.

---

### 4. Get Overridden Instances of a Series

```sql
SELECT * FROM events
WHERE recurring_event_id = $1
  AND is_recurrence_override = TRUE
ORDER BY start_at ASC;
```

**Purpose**: Track which instances have been manually modified.

---

### 5. Get Upcoming Instances for Reminders

```sql
SELECT * FROM events
WHERE is_completed = FALSE
  AND start_at > NOW()
  AND start_at <= NOW() + INTERVAL '1 hour'
  AND (is_recurrence_template = FALSE OR recurring_event_id IS NOT NULL)
ORDER BY start_at ASC;
```

**Purpose**: Reminder cron job queries instances (not templates).

---

### 6. Get Series by ID (for editing)

```sql
SELECT * FROM events
WHERE id = $1
  AND is_recurrence_template = TRUE;
```

**Purpose**: Load the series template for editing.

---

### 7. Get Next Ungenerated Instances (for lazy expansion)

```sql
SELECT * FROM events
WHERE id = $1
  AND is_recurrence_template = TRUE
  AND recurrence_generated_until < NOW() + INTERVAL '12 months';
```

**Purpose**: Identify series needing instance generation.

---

## Data Integrity & Constraints

### Business Rules (Backend Validation)

1. **Template vs. Instance Clarity**:
   - If `is_recurrence_template = TRUE`, then `recurring_event_id` must be NULL
   - If `is_recurrence_template = FALSE` and `recurring_event_id IS NOT NULL`, it's an instance

2. **Valid Recurrence Pattern**:
   - If `recurrence_frequency` is set, `recurrence_pattern` must be valid JSON
   - Weekly patterns must include at least one day: `{"days": ["mon", "wed"]}`
   - Monthly patterns must be either `{"type": "date", "value": 1-31}` or `{"type": "relative", "value": "1st_monday"}` etc.
   - Yearly patterns must include month and day: `{"month": 1, "day": 1}` or `{"month": 8, "relative": "2nd_tuesday"}`

3. **Recurrence End Validity**:
   - If `recurrence_end_type = 'never'`, `recurrence_end_value` is NULL
   - If `recurrence_end_type = 'after_occurrences'`, `recurrence_end_value` must be an integer > 0
   - If `recurrence_end_type = 'on_date'`, `recurrence_end_value` must be a valid ISO8601 date >= series start date

4. **Instance Generation Limit**:
   - Creating a recurring event must not generate more than 1000 instances (validation error if exceeded)
   - Default generation window: 12 months from creation date

5. **Override Constraints**:
   - Only instances can have `is_recurrence_override = TRUE`
   - If `is_recurrence_override = TRUE`, then `recurring_event_id IS NOT NULL`
   - `overridden_at` is set to NOW() when an override is created

6. **Past Event Protection**:
   - Instances with `start_at < CURRENT_DATE` cannot be edited or deleted
   - Validation error: "Cannot edit or delete events in the past"

### Cascade Behavior

- **Deleting a template**: All instances with `recurring_event_id = template_id` are soft-deleted (or hard-deleted if cascade enabled)
- **Deleting an instance**: No cascade; only that instance is deleted
- **Editing a series**: Creates new instances from the edit date forward; old instances remain unchanged

## Schema Diagram (Text)

```
events (existing table)
├── id (PK, UUID)
├── title, description
├── start_at, end_at
├── all_day
├── user_id (FK → users)
├── reminder_minutes_before
├── tag (ENUM: personal, work, health, deadline)
├── is_completed
├── created_at, updated_at
│
└── [NEW] Recurrence Columns
    ├── recurring_event_id (FK → events.id, self-referencing)
    ├── recurrence_frequency (ENUM: daily, weekly, monthly, yearly)
    ├── recurrence_pattern (JSONB: flexible pattern storage)
    ├── recurrence_end_type (ENUM: never, after_occurrences, on_date)
    ├── recurrence_end_value (TEXT: stores end value)
    ├── recurrence_generated_until (TIMESTAMPTZ: tracking generation)
    ├── is_recurrence_template (BOOLEAN)
    ├── is_recurrence_override (BOOLEAN)
    └── overridden_at (TIMESTAMPTZ)
```

## Migration Strategy

### Phase 1: Schema Only (V8)
- Add recurrence columns and indexes
- No data migration needed (all existing events remain single, with all new columns as NULL/FALSE)

### Phase 2: Service & API Layer
- Implement RecurringEventsService with instance generation logic
- Update EventsService to handle instances and templates

### Phase 3: UI Layer
- Add recurrence form fields to event creation/editing screens
- Implement series management views

## Performance Considerations

1. **Instance Count**: Limiting to 1000 instances prevents accidental huge series
2. **Indexes**: Composite indexes on (recurring_event_id, start_at) speed up calendar queries
3. **Lazy Generation**: For series extending >12 months, instances beyond the window are generated on-demand (future enhancement)
4. **JSONB Performance**: PostgreSQL JSONB is efficient for querying (e.g., `recurrence_pattern->>'days'`); consider denormalizing heavily-used patterns in future if needed

## Summary

| Item | Change | Rationale |
|------|--------|-----------|
| New columns (9) | Add to `events` | Enable template/instance tracking and recurrence rule storage |
| New ENUMs (2) | Create types | Provide type safety for recurrence frequency and end type |
| Indexes (5) | Add | Optimize queries for calendar, series lists, and instance lookups |
| New Entity fields | Update `Event` class | Reflect database changes in TypeORM |
| New Enums (2) | Create `.enum.ts` files | Per project conventions |
| Migration file | `V8__add_recurring_events_support.sql` | Single atomic migration |
