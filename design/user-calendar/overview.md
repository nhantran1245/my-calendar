# User Calendar Feature — Overview

## Feature Summary

The **User Calendar** feature provides a visual calendar interface for users to view, create, edit, and manage events. The calendar displays a full month view with the ability to navigate between months, shows events on their respective dates, and allows inline creation and editing of events (future dates only).

## Problem Statement

Users need an intuitive, visual way to:
1. See all their events in a month-at-a-glance format
2. Navigate between months to plan ahead or review past events
3. Quickly create new events by clicking on a date
4. Edit existing events to update details or change dates
5. Delete events they no longer need
6. Understand at a glance which dates have events and how many

Without this feature, users would need to resort to list views or search to find events, making it harder to spot patterns, conflicts, or upcoming deadlines visually.

## User Stories & Acceptance Criteria

### US-1: View Calendar for Current Month
As a user, I want to see a calendar grid showing the current month when I open the calendar view, so I can see all my events for this month at a glance.

**Acceptance Criteria:**
- Calendar displays the current month in a standard 7-column grid (Sun–Sat)
- Days from the previous/next month are shown in a muted style
- Today's date is visually highlighted (e.g., blue ring or filled circle)
- Event titles/counts are shown in each date cell
- Mobile: calendar fits the screen with readable text; desktop: calendar is spacious

### US-2: Navigate Between Months
As a user, I want to navigate to previous and next months using clear buttons, so I can plan ahead or review past events.

**Acceptance Criteria:**
- "Previous" and "Next" buttons are always visible and responsive
- Current month/year is displayed prominently (e.g., "June 2026")
- Buttons are disabled or indicate when at the earliest allowed month (configurable, e.g., 1 year back)
- Buttons are always enabled for future months
- Clicking a button smoothly transitions the calendar view

### US-3: View Events on a Date
As a user, I want to see event details (title, time) when I look at a date cell, so I know what's scheduled.

**Acceptance Criteria:**
- If a date has events, the first 2–3 event titles are shown (truncated with ellipsis if long)
- For all-day events, no time is shown
- For timed events, start time is shown (e.g., "2:30 PM")
- If a date has more than 3 events, a badge indicates count (e.g., "+2 more")
- Clicking a date shows full details or opens a detail modal

### US-4: Create an Event from Calendar
As a user, I want to create a new event by clicking on a date or a dedicated button, so I can quickly add events to my calendar.

**Acceptance Criteria:**
- Clicking on an empty date cell opens a quick-add form
- Quick-add form includes: title (required), start time, all-day toggle
- "Save" creates the event and closes the form
- "Cancel" closes the form without saving
- On mobile: form is a bottom sheet; on desktop: modal dialog
- New event appears immediately in the calendar after save (optimistic update)

### US-5: Edit an Existing Event
As a user, I want to edit an event by clicking on it in the calendar, so I can update details or reschedule.

**Acceptance Criteria:**
- Clicking on an event in the calendar opens the full edit form
- Edit form includes: title, description, start/end time, all-day toggle, reminder, completion status
- Date must be in the future (or today) — past events cannot be edited
- If attempting to edit a past event, a warning message is shown ("Cannot edit past events")
- "Save" updates the event; "Cancel" closes without changes
- Changes appear immediately in the calendar (optimistic update)

### US-6: Delete an Event
As a user, I want to delete an event from the calendar, so I can remove events I no longer need.

**Acceptance Criteria:**
- Each event has a delete button (trash icon or "Delete" button)
- Clicking delete shows a confirmation dialog
- Confirming deletes the event and removes it from the calendar
- Event is gone immediately from the calendar view (optimistic update)

### US-7: Mark Event as Completed
As a user, I want to mark an event as completed (e.g., task done), so I can track progress.

**Acceptance Criteria:**
- Each event has a checkbox or completion toggle
- Toggling completion updates the `isCompleted` flag
- Completed events are visually distinct (strikethrough, faded color, or badge)
- Completed status persists when the calendar is refreshed
- Note: This does NOT prevent editing or deletion of completed events

## Scope

### In Scope
- Full calendar grid displaying the current month (and ability to navigate)
- Display of event titles/times on date cells
- Quick-add event creation from date click
- Full edit of event details (title, description, times, reminder, completion status)
- Delete events with confirmation
- Mark events as completed
- Prevent editing/deletion of past events (validation)
- Responsive design for mobile (Expo) and desktop (Electron)
- Optimistic UI updates (event appears/updates immediately before server confirmation)

### Out of Scope
- Recurring events (each event is a single occurrence)
- Event color-coding or category tags
- Drag-and-drop to reschedule events
- Timezone support beyond the backend's timestamptz storage
- Sharing calendars or viewing other users' calendars
- Week view or day view (month view only for MVP)
- Print calendar
- Import/export events (ICS, Google Calendar sync)

## Key Constraints & Assumptions

1. **User Authentication**: Assumed that users are authenticated; the backend will serve their events only.
2. **Event Data**: Events already exist in the database via the Events entity. No new schema is required for the calendar feature itself.
3. **Dates**: Assumptions:
   - A month view starts on Sunday and ends on Saturday (configurable, but standard)
   - "Today" is defined as the current date in the user's local timezone
   - Past events are read-only; only future events can be edited
   - "Past" is defined as: event start date is before today
4. **Performance**: Assume events are queried by month (e.g., all events with startAt in June 2026). If a user has 1000+ events in a single month, we may need to implement pagination or filtering (out of scope for MVP).
5. **Real-time Updates**: The calendar will NOT auto-refresh when events are created elsewhere (e.g., via mobile app while desktop is open). Manual refresh via button or page reload is acceptable for MVP.

## Dependencies on Existing Modules

- **Events Entity & Service**: The calendar depends on the existing `events` module. All CRUD operations (create, read, update, delete) will use the Events service.
- **Events API (`/api/events`)**: The calendar will call existing and new endpoints on the Events controller.
- **Authentication**: Assumes the backend enforces user context (e.g., via JWT or session). Events are filtered by user (if user context is stored; currently not visible in the Event entity).
- **Reminder System**: The calendar displays the `reminderMinutesBefore` field but does not manage reminders directly. Reminders are handled by the existing RemindersService cron job.

## Future Enhancements (Not in MVP)

1. **User-owned Events**: Add `userId` foreign key to events table so each user sees only their own events.
2. **Event Categories/Tags**: Extend events with color-coding or tag labels.
3. **Week/Day Views**: Provide alternative calendar views.
4. **Recurring Events**: Support repeating events (daily, weekly, monthly).
5. **Offline Support**: Sync calendar state when the app goes offline.
6. **Undo/Redo**: Allow users to undo their last few calendar actions.
7. **Search/Filter**: Filter events by title, time, or completion status.
8. **Analytics**: Show stats (e.g., "5 events this month", "2 overdue").
