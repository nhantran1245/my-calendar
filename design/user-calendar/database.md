# User Calendar Feature — Database Design

## Current Event Schema (Existing)

The `events` table already exists and stores the core event data:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique event identifier |
| title | VARCHAR(255) | NOT NULL | Event name |
| description | TEXT | nullable | Event details |
| start_at | TIMESTAMPTZ | NOT NULL | Event start timestamp |
| end_at | TIMESTAMPTZ | nullable | Event end timestamp (for duration) |
| all_day | BOOLEAN | default FALSE | Whether event spans full day(s) |
| reminder_minutes_before | INT | nullable | Minutes before event to trigger reminder |
| is_completed | BOOLEAN | default FALSE | Whether event is marked done |
| created_at | TIMESTAMPTZ | default NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | default NOW() | Last modified timestamp |

**Indexes:**
- PK on `id`
- Trigger on `before update` to auto-set `updated_at`

## Database Changes Required for Calendar Feature

### Option 1: MVP (No Schema Changes)

For the initial MVP, **no schema changes are required**. The calendar feature will:
- Query events by month using the existing `start_at` column
- Filter and sort events in memory or via SQL queries
- No new columns or tables needed

Example query:
```sql
SELECT * FROM events
WHERE DATE_TRUNC('month', start_at) = DATE_TRUNC('month', $1::timestamptz)
ORDER BY start_at ASC;
```

**Rationale:** The existing schema is sufficient. If performance becomes an issue later (e.g., querying thousands of events per month), we can add indexes or denormalization.

---

### Option 2: Recommended for Future Scale (Post-MVP)

Once the calendar feature is used, we recommend adding a **composite index** for faster month-based queries:

**Migration:** `V5__add_calendar_indexes.sql`

```sql
-- Index for efficient month-based queries
CREATE INDEX IF NOT EXISTS idx_events_start_at_month
  ON events (DATE_TRUNC('month', start_at), is_completed, start_at)
  WHERE deleted_at IS NULL;
```

**Rationale:**
- Queries filtering by month + completion status + ordering by start time will use this index
- The `WHERE deleted_at IS NULL` anticipates soft deletes (if added later)
- This index supports the calendar's primary queries: "Show me all events for June 2026"

---

### Future Enhancement: User Ownership (Post-MVP)

If the application grows to multi-user, add a `user_id` column:

**Migration:** `V6__add_user_id_to_events.sql` (when multi-user is needed)

```sql
ALTER TABLE events
ADD COLUMN user_id UUID NOT NULL DEFAULT (uuid_generate_v4()),
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_events_user_id_start_at ON events(user_id, start_at);
```

This would ensure each user sees only their own events.

---

## Entity Changes

No changes to the existing `Event` entity are required for MVP. The calendar feature uses the existing entity as-is:

```typescript
// Existing Event entity (unchanged)
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

  @Column({ name: 'reminder_minutes_before', nullable: true, type: 'int' })
  reminderMinutesBefore: number | null;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

## Query Patterns

### 1. Get Events for a Specific Month

Used by the calendar view to populate the grid:

```sql
SELECT * FROM events
WHERE DATE_TRUNC('month', start_at) = DATE_TRUNC('month', $1::timestamptz)
ORDER BY start_at ASC;
```

**Parameters:** `$1` = first day of the month (e.g., 2026-06-01T00:00:00Z)

---

### 2. Get Events for a Specific Date

Used for day-view or date-cell detail popover:

```sql
SELECT * FROM events
WHERE DATE(start_at) = $1
ORDER BY start_at ASC;
```

**Parameters:** `$1` = date (e.g., '2026-06-15')

---

### 3. Check if a Date is in the Past

Used for validation (prevent editing past events):

```sql
SELECT EXISTS(
  SELECT 1 FROM events
  WHERE id = $1 AND DATE(start_at) < CURRENT_DATE
);
```

**Parameters:** `$1` = event id

---

### 4. Get Upcoming Events (for Reminders)

Used by the existing RemindersService:

```sql
SELECT * FROM events
WHERE is_completed = FALSE
  AND start_at > NOW()
  AND start_at <= NOW() + INTERVAL '1 hour'
ORDER BY start_at ASC;
```

---

## Data Integrity & Constraints

**Business Rules (Enforced in Backend):**
1. **No editing past events**: If `DATE(start_at) < CURRENT_DATE`, reject the update (400 Bad Request)
2. **Valid date range**: `endAt` must be >= `startAt` (if provided)
3. **Title required**: `title` cannot be empty
4. **Reminder range**: `reminderMinutesBefore` should be 0 to 1440 (0 to 24 hours)

These are enforced in the EventsService and DTOs, not at the database level, for flexibility.

---

## Summary

| Change | Required? | Rationale |
|--------|-----------|-----------|
| New tables | No | Existing `events` table is sufficient |
| New columns | No | All required fields exist |
| Indexes (MVP) | No | Not critical for small datasets |
| Indexes (Scale) | Yes (later) | Index `start_at` month for performance |
| Soft deletes | No (future) | When event recovery is needed |
| User ownership | No (future) | When multi-user support is added |

For now, proceed with the existing schema and only add the composite index (V5) once query performance becomes an issue (e.g., >500 events per month).
