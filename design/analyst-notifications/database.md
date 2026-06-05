# Analyst Notifications Feature — Database Schema

## New Tables

### `notifications`
Stores notification records for each event reminder sent to the user. This is the central audit log and state machine for the notification feature.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `uuid` | PRIMARY KEY | `gen_random_uuid()` | Unique notification identifier |
| `event_id` | `uuid` | NOT NULL, FK → events(id) | — | Reference to the event being reminded about |
| `user_id` | `uuid` | NOT NULL, FK → users(id) | — | User receiving the notification |
| `status` | `varchar(20)` | NOT NULL, CHECK (status IN ('PENDING', 'SENT', 'FAILED')) | `'PENDING'` | Delivery state: PENDING (created, not yet delivered), SENT (delivered to device), FAILED (delivery error) |
| `sent_at` | `timestamptz` | NULL | — | When notification was successfully sent to device. NULL until status = SENT. |
| `is_read` | `boolean` | NOT NULL | `false` | User opened the notification in-app |
| `read_at` | `timestamptz` | NULL | — | When user marked notification as read. NULL until is_read = true. |
| `is_dismissed` | `boolean` | NOT NULL | `false` | User dismissed/swiped away notification |
| `dismissed_at` | `timestamptz` | NULL | — | When user dismissed notification. NULL until is_dismissed = true. |
| `delivery_error` | `text` | NULL | — | Error message if status = FAILED (e.g., "FCM token expired", "Network timeout") |
| `created_at` | `timestamptz` | NOT NULL | `now()` | When notification was created |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Last updated (read/dismissed state change) |

**Indexes:**
- `PRIMARY KEY (id)` — direct lookup
- `UNIQUE (event_id, user_id)` — ensure one notification per event per user (idempotency)
- `INDEX (user_id, created_at DESC)` — list notifications for user, newest first
- `INDEX (user_id, is_read)` — find unread notifications quickly
- `INDEX (status, created_at)` — find PENDING/FAILED notifications for retry logic
- `INDEX (event_id)` — cascade delete if event deleted

**Justification:**
- Composite unique index on `(event_id, user_id)` prevents duplicate notifications when cron re-runs
- `status` enum tracks delivery lifecycle
- Separate `is_read` and `is_dismissed` booleans allow for notifications that are sent but not yet opened
- Timestamps (`sent_at`, `read_at`, `dismissed_at`) enable analytics queries (e.g., "median time from sent to read")
- `delivery_error` allows debugging and retry logic
- `created_at` + `updated_at` for audit trail

---

## Changes to Existing Tables

### `users` Table
Add DND (Do Not Disturb) mode support.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `dnd_until` | `timestamptz` | NULL | — | If set, notifications are suppressed until this timestamp. NULL = DND disabled. |
| `notification_enabled` | `boolean` | NOT NULL | `true` | Global kill-switch: if false, no notifications sent to this user (even without DND) |

**Why these columns:**
- `dnd_until`: Allows temporary mute without changing event-level reminder settings. Timestamp can be auto-calculated from user selections (15 min, 1 hour, etc.)
- `notification_enabled`: Provides a global "Do Not Disturb Everything" mode if needed later

**Migration strategy:** Add columns with defaults so existing users are unaffected.

---

## Flyway Migration Files

V1–V5 already exist. The notification feature requires **two new migrations**:

### `V6__add_user_id_to_events_and_dnd_to_users.sql`

Rationale: Events currently have no `user_id` — they must be linked to their owner before notifications can reference both. DND columns also land here since they belong to the user's profile, not the notifications table itself.

```sql
-- Link events to their owning user
ALTER TABLE events ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_events_user_id ON events(user_id);

-- DND (Do Not Disturb) support on the user record
ALTER TABLE users ADD COLUMN dnd_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN notification_enabled BOOLEAN NOT NULL DEFAULT true;
```

### `V7__create_notifications.sql`

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ DEFAULT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMPTZ DEFAULT NULL,
  delivery_error TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one notification per event per user (idempotency)
ALTER TABLE notifications ADD CONSTRAINT uk_notification_event_user UNIQUE (event_id, user_id);

-- Indexes for query performance
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read) WHERE is_dismissed = false;
CREATE INDEX idx_notifications_status_created ON notifications(status, created_at ASC) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_notifications_event_id ON notifications(event_id);

-- Trigger to auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│      users      │
├─────────────────┤
│ id (PK)         │◄──────────────────────┐
│ dnd_until       │                       │
│ notification    │                       │
│   _enabled      │                       │
└────────┬────────┘                       │
         │ 1:N                            │
         │                               │
    ┌────▼─────────────┐      ┌──────────┴──────┐
    │  notifications   │      │     events       │
    ├──────────────────┤      ├─────────────────┤
    │ id (PK)          │      │ id (PK)          │
    │ user_id (FK)    ─┼──────► (above)          │
    │ event_id (FK)   ─┼──────► id              │
    │ status           │      │ user_id (FK) ───►│ (added in V6)
    │ sent_at          │      │ title            │
    │ is_read          │      │ start_at         │
    │ is_dismissed     │      │ reminder         │
    │ created_at       │      │   _minutes_before│
    │ updated_at       │      │ created_at       │
    └──────────────────┘      │ updated_at       │
                              └──────────────────┘
```

**Relationships:**
- `users` → `events`: 1:N — each event belongs to one user (added in V6)
- `users` → `notifications`: 1:N — one user has many notifications
- `events` → `notifications`: 1:1 per user — unique constraint on `(event_id, user_id)`
- `notifications.user_id` FK → `users.id` ON DELETE CASCADE
- `notifications.event_id` FK → `events.id` ON DELETE CASCADE
- `events.user_id` FK → `users.id` ON DELETE SET NULL (nullable for backward compat with existing rows)

---

## Data Flow & State Machine

### Notification Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTIFICATION STATES                        │
└──────────────────────────────────────────────────────────────┘

1. SCHEDULING (RemindersService — daily cron at midnight + OnModuleInit)
   ├─ Query events: where (startAt - reminderMinutesBefore) falls within the next 24 hours
   ├─ For each event, compute reminderAt = startAt - reminderMinutesBefore * 60s
   ├─ If reminderAt > now: register a named setTimeout via SchedulerRegistry
   ├─ On event create/update: re-register its timeout (EventEmitter2 listener)
   └─ On event delete: cancel its timeout

2. CREATION (When scheduled timeout fires)
   ├─ Check: user.notification_enabled = true
   ├─ Check: user.dnd_until IS NULL OR user.dnd_until < now
   └─ INSERT notification(event_id, user_id, status='PENDING')
      ├─ If UNIQUE constraint fails → notification already exists, skip
      └─ If INSERT succeeds → proceed to delivery
      └─ created_at ← now()

2. DELIVERY (NotificationDeliveryService)
   ├─ Dequeue notification(status='PENDING')
   ├─ Try to send to device (FCM/APNs/Electron)
   ├─ On success: UPDATE notification SET status='SENT', sent_at=now()
   └─ On failure: UPDATE notification SET status='FAILED', delivery_error=message
       └─ Retry logic: query status='FAILED' and retry N times over M hours

3. USER INTERACTION (App: NotificationsScreen)
   ├─ User opens notification → UPDATE is_read=true, read_at=now()
   ├─ User dismisses notification → UPDATE is_dismissed=true, dismissed_at=now()
   └─ updated_at auto-updated on each change via trigger

4. CLEANUP (Optional: future background job)
   └─ After 90 days: soft-delete or archive (not yet scoped)
```

### State Diagram

```
              ┌─────────┐
              │ PENDING │  ◄─── Initial state when notification created
              └────┬────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    Delivery    Delivery    (DND: stay PENDING)
    succeeds    fails
        │          │          
        ▼          ▼          
      SENT      FAILED       
        │          │
        │  (Retry: try to resend)
        │
    User reads/dismisses
        │
        ▼
     [END] — Notification remains in list until user dismisses or auto-cleanup
```

---

## Normalization & Denormalization Decisions

### Normalized: Event Data
Notification does NOT store a copy of event title, description, etc. Instead:
- Notification stores `event_id` only
- When displaying notification, app joins with events table to get current title/description
- **Pro**: Event edits reflect in notification list immediately
- **Con**: Slight query overhead (but minimal with INDEX on event_id)

### Denormalized: Event Title for Analytics
*Future enhancement:* If analytics queries are very frequent and event data changes rarely, consider adding `event_title_snapshot` column to capture the title at notification time (immutable audit trail).

### No Soft Delete for Users/Events
- If event is deleted, its notifications are cascade-deleted (not soft-deleted)
- If user is deleted, all notifications are cascade-deleted
- This is acceptable because:
  - Notifications are ephemeral (user deletes → cleans up)
  - Event deletion is rare
  - Simplifies cleanup logic

---

## Indexing Strategy

| Index | Columns | Type | Purpose | Est. Cardinality |
|-------|---------|------|---------|------------------|
| PK | `id` | Primary Key | Direct lookup, FK references | High |
| UK | `(event_id, user_id)` | Unique | Prevent duplicates, idempotency | Very High (sparse) |
| I1 | `(user_id, created_at DESC)` | Composite | List notifications for user, newest first | High × High |
| I2 | `(user_id, is_read)` WHERE is_dismissed=false | Partial | Find unread notifications | Medium |
| I3 | `(status, created_at ASC)` WHERE status IN ('PENDING', 'FAILED') | Partial | Find pending/failed for delivery/retry | Low |
| I4 | `(event_id)` | Simple | FK cascade, query by event | High |

**Cardinality estimate (for 100K users, 10K events per user, 1 reminder per event):**
- notifications table: ~100M rows
- Most queries filter by `user_id` first (partition naturally by user)
- I1 is the hottest index (list screen hits it on every load)
- I3 is sparse (only active during delivery processing)

---

## Performance Considerations

### Write Performance (Notification Creation)
- INSERT on unique constraint check is fast (B-tree lookup, no full table scan)
- Trigger for `updated_at` is negligible
- No complex joins, fully normalized
- Cron running every 60s, likely creating 100–1000 notifications per minute per active user (acceptable)

### Read Performance (Notification List)
- Query: `SELECT * FROM notifications WHERE user_id=? AND is_dismissed=false ORDER BY created_at DESC LIMIT 50`
- Index I1 makes this nearly instant (B-tree range scan)
- No joins needed (event data fetched separately or in app layer)

### Deletion Performance (User/Event Cascade)
- ON DELETE CASCADE on small tables (users, events) is acceptable
- Bulk cascades (delete 1000 events) might lock notifications table briefly; acceptable for operations that are rare

### Archive/Cleanup (Future)
- When notifications exceed retention (e.g., 90 days), run bulk DELETE in batches
- Query: `DELETE FROM notifications WHERE created_at < now() - interval '90 days' LIMIT 10000` in a loop
- Prevents long locks; spreads I/O

---

## Migration Rollback Strategy

Flyway migrations are immutable once applied. To "roll back," create new compensating migrations:

```sql
-- V8__rollback_notifications.sql (undo V7)
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
DROP FUNCTION IF EXISTS update_notifications_updated_at;
DROP TABLE IF EXISTS notifications;

-- V9__rollback_user_event_changes.sql (undo V6)
ALTER TABLE events DROP COLUMN IF EXISTS user_id;
ALTER TABLE users DROP COLUMN IF EXISTS dnd_until;
ALTER TABLE users DROP COLUMN IF EXISTS notification_enabled;
```

In practice, prefer database restore over compensating migrations for destructive rollbacks.

---

## Summary

- **New table**: `notifications` (central audit log for sent reminders) — V7
- **Modified tables**: `events` (add `user_id` FK), `users` (add `dnd_until`, `notification_enabled`) — V6
- **Migrations**: V6 (prerequisite: link events → users, DND columns) + V7 (notifications table)
- **Indexes**: 5 strategic indexes for list/delivery/retry queries
- **Constraints**: UNIQUE on `(event_id, user_id)` for idempotency
- **Triggers**: Auto-update `updated_at` on changes
- **Foreign keys**: Cascade delete on event/user removal; SET NULL on events if user deleted
- **Scheduler**: Daily cron at midnight + OnModuleInit schedules precise per-event timeouts (no per-minute polling)
- **Normalization**: Event data not duplicated; join on demand
