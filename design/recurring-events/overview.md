# Recurring Events Feature — Overview

## Feature Summary

The **Recurring Events** feature allows users to define events that repeat on a schedule (daily, weekly, monthly, yearly) instead of manually creating each occurrence. Users can set up events like "Football every Monday 7pm–8:30pm" or "Friend's birthday every year on August 15th" once and the system automatically generates instances for a configurable future window.

## Problem Statement

Users currently must manually create each event instance. For recurring activities (hobbies, appointments, anniversaries, birthdays), this is repetitive and error-prone:

1. **Friction**: Creating 52 instances of a weekly event is tedious
2. **Maintenance**: If a recurring event needs to update (e.g., "5pm instead of 7pm"), the user must edit every instance or recreate the series
3. **Calendar clutter**: The calendar view shows individual events without connection to a series, making it hard to understand patterns
4. **Reminder noise**: Each instance gets its own reminder, when users typically want one pattern per series

The recurring-events feature solves this by:
- Creating a repeating event template once
- Automatically expanding into individual event instances
- Allowing bulk updates to future instances
- Supporting overrides (e.g., skip one Monday, adjust another to 6pm)

## User Stories & Acceptance Criteria

### US-1: Create a Recurring Event
As a user, I want to create a recurring event (daily, weekly, monthly, yearly) with an optional end date, so I don't have to manually add each occurrence.

**Acceptance Criteria:**
- Event creation form includes a "Recurring" toggle
- When toggled ON, I can select:
  - Repeat frequency: Daily, Weekly, Monthly, Yearly
  - Weekly: checkboxes for days of week (Mon–Sun)
  - Monthly: date (e.g., 15th) or day pattern (e.g., "2nd Tuesday")
  - Yearly: same month/day or relative pattern
  - End condition: Never, After N occurrences, On a specific date
- Start time, end time, all-day status, title, description, reminder apply to ALL instances
- "Save" creates the recurring event template and generates instances for the next 12 months (configurable window)
- Instance count is shown before save (e.g., "This will create 52 events")
- Both mobile and desktop apps support creation

### US-2: View Recurring Events in Calendar
As a user, I want to see recurring events in my calendar, so I can distinguish them from one-off events.

**Acceptance Criteria:**
- Each event instance in the calendar shows a small badge or icon indicating it's part of a recurring series (e.g., circular arrow icon)
- Clicking on an instance reveals which recurring template it belongs to
- The recurring series name/pattern is displayed (e.g., "Weekly Football Mon 7pm")
- Calendar displays generated instances, not the template

### US-3: Edit a Single Instance of a Recurring Event
As a user, I want to edit one instance of a recurring event (e.g., change time, delete, mark complete), so I can handle exceptions without affecting the whole series.

**Acceptance Criteria:**
- Clicking "Edit" on a recurring event instance shows a dialog: "Edit this event only" vs. "Edit this and following"
- "Edit this event only" updates just that instance (stores an override)
- Changes are reflected immediately in the calendar
- The instance no longer matches the series pattern visually (e.g., bold text, different icon)
- Undoing the override reverts to the series default

### US-4: Edit All Future Instances of a Recurring Event
As a user, I want to change a recurring event pattern starting from a specific date onward, so I can adapt to schedule changes.

**Acceptance Criteria:**
- Selecting "Edit this and following" on any instance allows updating the series
- Changes apply to the selected instance and all future instances
- Instances before the change date remain unchanged
- Past instances cannot be edited (validation error shown)
- The UI shows a warning if editing a series: "This will update X future events"

### US-5: Delete a Single Instance (Skip)
As a user, I want to skip a single occurrence of a recurring event, so I can handle schedule conflicts.

**Acceptance Criteria:**
- Each event instance has a "Delete" option
- Deleting a recurring instance shows: "Skip this event" vs. "Delete entire series"
- "Skip this event" removes only that instance
- "Delete entire series" removes all instances (with confirmation)
- Skipped instances are hidden from the calendar
- The instance count on the series is updated

### US-6: Delete a Recurring Event Series
As a user, I want to delete a recurring event series entirely, so I can stop events I no longer need.

**Acceptance Criteria:**
- Deleting any instance of a recurring event series offers the choice to skip just that one or delete the series
- "Delete series" removes all instances and the template
- A confirmation dialog shows how many events will be deleted
- All instances disappear immediately from the calendar (optimistic update)

### US-7: View and Manage Recurring Event Series
As a user, I want to see a list of my active recurring events, so I can manage them in one place.

**Acceptance Criteria:**
- A "Recurring Events" or "Series" screen shows all active recurring event templates
- Each series shows: name, pattern (e.g., "Every Mon, Wed, Fri"), start date, end condition, next occurrence
- Series can be archived/deleted from this list
- Clicking a series shows all its generated instances
- On mobile: accessible via a tab or menu; on desktop: sidebar option

### US-8: Handle Recurring Events in Reminders
As a user, I want reminders for recurring events to work like single events, so I get notified for each occurrence.

**Acceptance Criteria:**
- Each generated instance inherits the reminder setting from the series
- Dismissing or snoozing a reminder for one instance does not affect other instances
- The reminder system queries for instances, not the template
- If a series changes its reminder time, only future instances get the new time

## Scope

### In Scope
- Create recurring events with daily, weekly, monthly, yearly frequencies
- Weekly: select specific days (Mon–Sun)
- Monthly: select date (15th) or relative day (2nd Tuesday, last Friday)
- Yearly: same month/day or relative pattern
- End conditions: Never, After N occurrences, On a specific date
- Automatic instance generation for a 12-month configurable window
- View recurring event instances in the calendar
- Edit a single instance (with override tracking)
- Edit all future instances starting from a selected date
- Delete/skip a single instance
- Delete entire recurring event series
- List view of all active recurring series
- Reminders work with instances
- Both mobile and desktop apps support the feature
- Optimistic UI updates for create/edit/delete actions

### Out of Scope
- Custom recurrence patterns (e.g., "Every 3 weeks on Mon and Fri")
- Recurrence exceptions managed via UI (can add via override, but no bulk exception list)
- Timezone handling beyond timestamptz storage
- Sharing recurring events or inviting attendees
- iCalendar (ICS) import/export or recurring event sync (Google Calendar, Outlook)
- Recurring events with per-instance custom durations (duration is locked to series)
- Migration tool to convert existing single events into a series
- Recurring event analytics or statistics

## Key Constraints & Assumptions

### Technical Constraints
1. **Instance Generation Window**: Instances are pre-generated for the next 12 months at creation time. Older instances beyond the window are deleted; future instances beyond 12 months are generated on-demand or periodically.
2. **Performance**: Generating instances happens synchronously during creation (< 500 instances). If a series creates >1000 instances, it's rejected (validation error).
3. **Database Size**: Storing individual instances (not lazy-generating) trades storage for simpler queries. Assume moderate usage (< 100 active series per user).
4. **Reminders**: The reminder cron queries instances like any other event. No special handling needed beyond instance inheritance of the reminder field.

### Assumptions
1. **User Context**: Events belong to a user (though not yet in the current schema; design assumes future user_id column)
2. **Timezone**: All timestamps are in UTC (timestamptz). Recurring event creation uses the user's local timezone, converted to UTC before saving.
3. **Instance Immutability**: Generated instances are independent events; editing one doesn't cascade to others
4. **Overrides**: Single-instance overrides are stored as a separate `override` flag/record on the instance event
5. **Past Events**: Instances in the past cannot be edited or deleted (validation enforced)

## Dependencies on Existing Modules

- **Events Entity & Service**: The recurring-events feature extends the existing Event entity with a `recurringEventId` foreign key and adds new columns (`recurrenceRule`, `recurrenceEndDate`, `isRecurrenceOverride`, `overriddenAt`).
- **Events API (`/api/events`)**: New endpoints added for CRUD of recurring events; existing event endpoints used for instance management.
- **Events Controller**: Existing controller methods (GET, POST, PATCH, DELETE) are reused and extended to handle recurring event templates.
- **RemindersService**: No changes needed; the cron job already queries all events and will automatically include instances.
- **Calendar Feature**: The calendar displays instances. No changes to the calendar logic needed; it queries events as usual.
- **Authentication**: Assumes user context exists (currently missing from schema; will be added).

## Future Enhancements (Not in MVP)

1. **Custom Recurrence**: Support patterns like "Every other week" or "Every 3 months on the 1st and 15th"
2. **Recurrence Exceptions List**: UI to manage all exceptions/overrides of a series in one place
3. **Recurring Event Copy**: Duplicate a series with new dates
4. **Bulk Instance Management**: Update/delete multiple selected instances at once
5. **Instance History**: View past instances of a recurring event
6. **Recurrence Templates**: Save user-defined patterns (e.g., "My work hours") and reuse them
7. **iCalendar Support**: Import/export recurring events as ICS files
8. **Recurring Event Sync**: Sync with Google Calendar, Outlook, or other calendar services
9. **Smart Rescheduling**: "Move all Monday events to Tuesday" in one action
10. **Timezone Handling**: Let users set a timezone per recurring event and adjust instances for DST

## Architecture & Implementation Notes

### Instance Generation Strategy
- **Synchronous generation at creation**: When a user creates a recurring event, instances are generated immediately up to the 12-month window and stored in the `events` table
- **Lazy expansion for future**: If a series' end date is >12 months away, instances beyond 12 months are created on-demand via a background job (not in MVP)
- **Soft delete instances**: Deleting a series soft-deletes all instances; no cascade deletions

### Override Management
- **Override flag on instance**: Each event instance has `isRecurrenceOverride: boolean` and `overriddenAt: Date` to track if it differs from the series template
- **Override storage**: Single-instance changes are stored directly on the event record; no separate override table
- **Recalculation**: When a series is edited with "all future," new instances are created from that date; old instances remain as overrides or are regenerated

### UI Patterns
- **Instance vs. Series Context**: When editing, the UI must clarify whether the user is editing one instance or the series
- **Confirmation Dialogs**: Bulk actions (edit series, delete series) always show a confirmation with the count of affected instances
- **Visual Indicators**: Recurring instances have a small icon or badge; overridden instances have a different visual treatment
- **Mobile/Desktop Parity**: Both platforms support the same features; mobile may use bottom sheets for dialogs instead of modals

### Query Patterns
- **Get instances for calendar**: Filter by date range and `recurringEventId IS NOT NULL` to identify recurring instances
- **Get series**: Filter by `recurringEventId IS NULL` to get templates
- **Get all instances of a series**: Query by `recurringEventId = $1`
- **Get overridden instances**: Query by `recurringEventId = $1 AND isRecurrenceOverride = true`
