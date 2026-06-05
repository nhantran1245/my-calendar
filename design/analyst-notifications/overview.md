# Analyst Notifications Feature — Overview

## Feature Summary

The **Analyst Notifications** feature is a persistent, user-facing notification system that surfaces upcoming calendar events and reminders to users across all platforms (mobile and desktop). It transforms the existing backend reminder cron job (which currently only logs events) into a real, deliverable notification system that:

1. **Proactively alerts users** about upcoming events based on their `reminderMinutesBefore` preference
2. **Tracks notification state** (sent, read, dismissed) per event per user
3. **Persists notification history** for analytics and audit purposes
4. **Supports platform-specific delivery** (push notifications for mobile, native OS notifications for desktop)
5. **Provides user control** over notification preferences (mute individual notifications, batch actions)

## Problem It Solves

Currently, the reminder system exists only as a server-side cron job that logs upcoming events. Users have no way to:
- See that their event reminder window is approaching
- Receive notifications on mobile or desktop
- Track which events they've been notified about
- Manage or dismiss notifications
- Control notification delivery per event or globally

This feature closes the gap by persisting notification state, delivering them to users, and letting them manage their notification experience.

## User Stories & Acceptance Criteria

### Story 1: User receives a notification for an upcoming event
**As a** calendar user  
**I want** to receive a notification reminder when an event is within my configured reminder window  
**So that** I don't miss important upcoming events.

**Acceptance Criteria:**
- When an event's `reminderMinutesBefore` time is reached, a notification is created and sent to the user's device(s)
- On mobile: notification appears in the native push notification tray (via FCM/APNs)
- On desktop: notification appears as a macOS native notification (via Electron API)
- Each notification is recorded in the database with `sent_at` timestamp
- A notification is only sent once per event (idempotency: if the cron re-runs, duplicate notifications are not sent)

### Story 2: User sees notifications in the app
**As a** calendar user  
**I want** to see a list of recent notifications in my app  
**So that** I can track what I've been notified about and manage them.

**Acceptance Criteria:**
- A "Notifications" screen/section shows the last 50 notifications, newest first
- Each notification displays: event title, send time, read status, and a dismiss button
- Notifications are marked as "read" when the user opens them
- Users can dismiss individual notifications
- Users can dismiss all notifications at once (bulk action)
- The notification list updates in real-time as new notifications arrive

### Story 3: User controls notification preferences per event
**As a** calendar user  
**I want** to enable/disable notifications for individual events  
**So that** I only get reminded about events I care about.

**Acceptance Criteria:**
- When viewing or editing an event, the user can set/change `reminderMinutesBefore`
- Setting `reminderMinutesBefore` to `null` disables reminders for that event
- The change is reflected immediately in the reminder cron on the next cycle
- If a user disables reminders before the reminder fires, no notification is sent

### Story 4: User can mute notifications temporarily
**As a** calendar user  
**I want** to temporarily mute notifications  
**So that** I don't get interrupted during focus time.

**Acceptance Criteria:**
- User can enable a "Do Not Disturb" mode that silences notifications for a specified duration (15 min, 1 hour, 4 hours, until tomorrow)
- While DND is active, notifications are still recorded in the database but not delivered to the device
- The app shows a DND indicator when active
- When DND expires, the next reminder notification is sent normally
- DND mode can be disabled early by the user

### Story 5: Admin analytics on notification delivery
**As an** analyst  
**I want** to see metrics on notification delivery (sent, read, dismissed rates)  
**So that** I can measure feature engagement and identify issues.

**Acceptance Criteria:**
- Backend provides endpoints to query notification statistics:
  - Total notifications sent (filtered by date range)
  - Read/dismissed/ignored counts
  - Delivery success rate (sent vs. delivery errors)
- Notifications store enough metadata to enable future analytics without re-querying events

## Core User Flows

### Flow 1: Event Reminder → Notification Delivery
```
1. User creates/updates event with reminderMinutesBefore = 15
2. Backend reminder cron runs (every minute)
3. Cron queries events where (startAt - 15 min) falls in next 60 seconds
4. For each matching event:
   a. Check if a notification was already sent (idempotency)
   b. Check if user has DND active
   c. Create notification record with status = SENT
   d. Enqueue delivery task (FCM, APNs, Electron API)
   e. Set sent_at timestamp
5. Mobile/desktop client receives and displays notification
6. User taps notification → opens app, event details visible
7. Notification marked as READ
```

### Flow 2: User Manages Notifications
```
1. User opens "Notifications" screen in app
2. List displays recent notifications (paginated, newest first)
3. Each notification shows: event title, time sent, read status
4. User can:
   a. Tap a notification → navigate to event details
   b. Swipe/tap dismiss → soft-delete notification
   c. Enable DND → notifications paused, shown in UI
   d. Dismiss all → clear all unread notifications
5. State synced to backend
```

### Flow 3: Configure Per-Event Reminders
```
1. User views event details
2. User taps "Reminder" setting
3. User selects reminder time: 5 min, 15 min, 30 min, 1 hour, 1 day, or OFF
4. Value stored in event.reminderMinutesBefore
5. On next cron cycle, new reminder value takes effect
6. If changed to OFF (null), no notification is sent even if reminder window passed
```

## Key Constraints & Assumptions

1. **User authentication exists**: All notification endpoints require JWT auth; notifications are user-scoped.
2. **One user per session**: The app is a personal calendar (single-user per device). No multi-user sharing yet.
3. **Device delivery channels must be configured separately**: This design covers the data model and API. Push notification integrations (FCM, APNs, Electron IPC) are out of scope but called by the backend at `sent_at` time.
4. **Idempotency is critical**: The reminder cron may run multiple times for the same event (clock skew, retries). Notifications must not be duplicated.
5. **Soft delete only**: Dismissed notifications are marked `is_dismissed = true`, not hard-deleted, to preserve audit trail.
6. **No per-device targeting yet**: Notifications go to all authenticated user sessions. Multi-device management is future work.
7. **Real-time delivery not required**: Notifications are delivered on best-effort basis. No guaranteed at-least-once delivery contract (mobile push is inherently best-effort).

## In Scope

- Notification data model and persistence (PostgreSQL)
- Notification creation and state management (backend service)
- DND mode (temporary mute)
- Notification list and management UI (mobile + desktop)
- Per-event reminder configuration (already exists via `reminderMinutesBefore`)
- Basic analytics endpoints (count, read/dismiss rates)
- Idempotency: prevent duplicate notifications per event
- Soft delete / dismissal workflow

## Out of Scope

- Push notification platform integration (FCM, APNs, Electron IPC setup). The backend calls a `NotificationDeliveryService` to send; the *implementation* of that service is separate.
- Multi-user account sharing or permissions
- Notification scheduling (e.g., queue a notification for 5 hours from now)
- Notification aggregation (e.g., "You have 5 upcoming events")
- Deep links from notifications (tap → go directly to event; basic for now)
- Advanced analytics UI dashboard
- Notification customization templates
- Notification sound/vibration preferences (delegated to device OS settings)
- Multi-device sync (notifications marked read on phone don't auto-sync to desktop)
- Notification expiry (notifications remain in list indefinitely until dismissed)

## Dependencies on Existing Modules

### Events Module
- Relies on `Event` entity with `reminderMinutesBefore`, `startAt`, `title`, `id`, and `createdAt`
- Reads events during reminder cron execution via `EventsService.findUpcomingReminders()`
- No changes to Event entity needed; notification feature builds on top

### Reminders Module
- Enhances the existing `RemindersService.checkReminders()` cron
- Converts the logger calls to notification creation + delivery calls
- Uses new `NotificationsService` to persist and dispatch notifications

### Auth Module
- Notifications are user-scoped; require JWT authentication on all endpoints
- User entity used for notification queries (optional: add `notificationPreferences` later)
- No changes to Auth module required

### Database (Flyway migrations)
- New migration `V6__create_notifications.sql` (see database.md for schema)
- No changes to existing tables (events, users, etc.)

---

## Implementation Notes

### Idempotency Strategy
To prevent duplicate notifications, the reminder cron uses a **compound unique index** on `(event_id, user_id)` to ensure only one notification per event per user. When the cron runs:

```
1. Query events matching reminder window
2. For each event:
   - Try to insert new notification with status = PENDING
   - If INSERT fails due to unique constraint → notification already exists
   - If INSERT succeeds → proceed to delivery
```

This avoids expensive SELECT-before-INSERT queries.

### Delivery Decoupling
The reminder cron is not responsible for actually delivering notifications (FCM, APNs, etc.). It:
1. Creates a notification record with `status = PENDING`
2. Publishes a message to a delivery queue or directly calls a `NotificationDeliveryService`
3. Updates `status = SENT` and `sent_at` when delivery is confirmed

This keeps the cron fast and decouples notification persistence from delivery.

### DND Mode Implementation
- Add `dnd_until` column to `User` entity (nullable, ISO8601 timestamp)
- Before delivering a notification, check: `if (user.dnd_until > now) skip delivery, but still create notification record`
- Endpoint `POST /api/notifications/dnd` to set DND; `DELETE /api/notifications/dnd` to cancel early
- DND auto-expires when its timer reaches `now`

---

## Related Epics / Future Work

1. **Notification Delivery Integration** — Implement actual FCM, APNs, and Electron IPC delivery
2. **Advanced Preferences** — Per-event sound/vibration settings, quiet hours (8 PM - 8 AM), etc.
3. **Notification History Retention Policy** — Auto-archive notifications older than 90 days
4. **Multi-Device Sync** — When user dismisses on mobile, also mark dismissed on desktop
5. **Analytics Dashboard** — Charts for notification sent/read/clicked rates over time
6. **Notification Templates** — Customize notification text, icons, sounds
7. **Event-to-Notification Deep Linking** — Tap notification → open event details, not just app
