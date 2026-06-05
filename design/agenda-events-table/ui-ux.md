# Agenda Events Table — UI/UX Design

## Overview

The Agenda feature UI remains largely unchanged from the original design. The key difference is **semantic**: users interact with "agenda events" (standalone tasks owned by agendas) instead of "calendar events added to agendas" (junction table model).

**From a UX perspective**: No visible change to the user. From a data model perspective: Agenda events are first-class, independent entities with copy-on-write semantics when created from calendar events.

This document highlights the UI screens and interactions, with notes on the new data model where relevant.

---

## Agenda List Screen

### Purpose

Displays upcoming agendas in chronological order, allowing users to browse and drill into details.

### Default Behavior

- **Initial view**: Shows future agendas (startAt >= now), sorted by startAt ascending
- **Sort order**: Oldest-to-newest (events/agendas from today forward)
- **Pagination**: Server-side; loads first page (20 items) on mount
- **Scroll direction**:
  - Scroll **down** → load more future agendas
  - Scroll **up** → load past agendas

### Layout (Mobile & Desktop)

```
┌─────────────────────────────────────────┐
│  Agenda                                 │ (header)
│  ╭─────────────────────────────────────╮│
│  │ < Today's Agendas                   ││ (section header with date context)
│  ├─────────────────────────────────────┤│
│  │ Q2 Planning & Review                ││ (agenda item)
│  │ Mon, Jun 15 • 09:00 – 17:00         ││ (date range, time)
│  │ Active • 5 events                   ││ (status, event count badge)
│  └─────────────────────────────────────┘│
│  ╭─────────────────────────────────────╮│
│  │ Team Offsite Dinner                 ││ (agenda item)
│  │ Mon, Jun 15 • 18:30 – 21:00         ││
│  │ Active • 3 events                   ││
│  └─────────────────────────────────────┘│
│  [Loading more...] or [Load next page]  │ (pagination control)
│                                         │
│  < Swipe up or tap "Past" to view      │ (hint text for past agendas)
│  < earlier agendas                      │
└─────────────────────────────────────────┘
```

### Agenda Item Structure

Each agenda card in the list shows:

| Element | Content | Notes |
|---------|---------|-------|
| **Title** | Agenda title (max 1 line, truncate if needed) | Tappable; opens detail screen |
| **Date/Time** | "Mon, Jun 15 • HH:MM – HH:MM" | Formatted from startAt/endAt; local user timezone |
| **Status badge** | "Active" / "Completed" / "Cancelled" | Color-coded; smaller font |
| **Event count** | "5 events" | Number of agenda events in agenda (see: these are now standalone agenda_events) |
| **Description preview** | First 60 chars of description (if exists) | Optional; ellipsis if truncated |

### Interactions

#### Scroll Down (Load Future)
- User scrolls to bottom of list
- Condition: `hasMore === true` in pagination metadata
- Action: Fetch next page via `GET /api/agendas?limit=20&offset=20`
- Loading state: Spinner or skeleton at bottom of list
- Error handling: Show "Failed to load more" toast with retry button

#### Scroll Up (Load Past)
- User scrolls to very top of list
- Condition: Must pass a threshold to trigger "reveal past" UI
- Presentation options:
  - **Option A (Recommended)**: Show sticky "Tap to load past" button at top of list
  - **Option B**: Auto-load on scroll-up past threshold
- Action: Fetch agendas with `direction=backward` and appropriate timestamp filter via `GET /api/agendas?direction=backward&limit=20`
- Loading state: Skeleton rows inserted at top
- Transition: Agendas appear above current list with visual distinction (e.g., grouped under "Past" header)

#### Tap on Agenda Item
- Navigate to Agenda Detail screen
- Pass agenda ID as route parameter
- Preserve scroll position for back navigation (if platform supports it)

#### Tap on Status Badge (Optional, Phase 2)
- Quick status change without navigating to detail
- Shows inline dropdown: [Active] [Completed] [Cancelled]
- On selection: PATCH `/api/agendas/:id` with new status, reflect change immediately
- (Defer to Phase 2 if complexity concerns)

#### Refresh/Pull-to-Refresh (Mobile)
- Pull down at top of list to refresh future agendas
- Clears pagination offset, refetches from start
- Show refresh spinner at top
- Return to original scroll position after refresh

### States

#### Loading (Initial)
- Skeleton screen: 3–4 placeholder cards
- Placeholder height matches real agenda cards
- Shimmer animation (subtle)

#### Empty State (No Future Agendas)
```
┌─────────────────────────────────────────┐
│  Agenda                                 │
│                                         │
│                                         │
│            📅 No upcoming agendas       │
│                                         │
│     You don't have any agendas          │
│     scheduled from now onward.          │
│                                         │
│     [Create Agenda] (or similar CTA)    │
│                                         │
│     Swipe up to view past agendas       │
│                                         │
└─────────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────────┐
│  Agenda                                 │
│                                         │
│           ⚠️  Failed to load agendas    │
│                                         │
│     Something went wrong. Please try    │
│     again or check your connection.     │
│                                         │
│                    [Retry]              │
│                                         │
└─────────────────────────────────────────┘
```

### Accessibility

- **Keyboard navigation (Desktop)**: Tab through agenda items, Enter to open detail
- **Screen reader**: Read title, date range, status, event count for each item
- **Color contrast**: Status badges must meet WCAG AA (4.5:1 for text)
- **Touch targets (Mobile)**: Agenda cards must be ≥44x44 pt (iOS) or 48x48 dp (Android)

---

## Agenda Detail Screen

### Purpose

Shows full agenda information and a paginated list of **agenda events** (standalone events owned by this agenda).

### Layout (Mobile & Desktop)

```
┌─────────────────────────────────────────┐
│  < Q2 Planning & Review        [Edit]   │ (header with back, title, edit button)
├─────────────────────────────────────────┤
│  Mon, Jun 15 • 09:00 – 17:00            │ (date range)
│  Status: Active                         │ (status with change option)
│  📍 Office Building A                   │ (location, if applicable)
│  📝 Quarterly review session with...    │ (description, truncated)
│                                         │
│  ─────────────────────────────────────  │ (divider)
│  Events (5 total)                       │ (section header — NOTE: "Events" = agenda events)
│  [+ Add Event]                          │ (CTA to create new agenda event)
│  ─────────────────────────────────────  │
│                                         │
│  ╭─────────────────────────────────────╮│ (future agenda events by default)
│  │ ✓ Finalize Q2 budget                ││ (status indicator + title)
│  │ 09:00 – 09:30                       ││ (time; independent of any source event)
│  │ ○ Active                            ││ (status pill; tap to change)
│  └─────────────────────────────────────┘│
│  ╭─────────────────────────────────────╮│
│  │ Team standup                        ││
│  │ 10:00 – 10:45                       ││
│  │ ○ Active                            ││
│  │ (from calendar event)               ││ (optional: visual hint if from source event)
│  └─────────────────────────────────────┘│
│                                         │
│  [Load more events...]                  │
│  (or: Scroll up to see past events)     │
│                                         │
└─────────────────────────────────────────┘
```

### Header Section

| Element | Details |
|---------|---------|
| **Back button** | Navigates to Agenda List screen |
| **Title** | Agenda title; can be long (wrap if needed) |
| **Edit button** | Icon button (pencil or "Edit") → opens edit modal/screen |

### Agenda Metadata Section

| Field | Details |
|-------|---------|
| **Date range** | "Mon, Jun 15 • HH:MM – HH:MM" formatted from startAt/endAt |
| **Status** | "Active" / "Completed" / "Cancelled"; tappable pill for quick change |
| **Description** | Full text (or truncated with "Read more" if very long) |

### Agenda Events Section

#### Default Behavior
- Shows **future agenda events** of the agenda (startAt >= now), sorted by startAt ascending
- Paginated (20 items per page)
- "Events" now refers to **agenda_events** (standalone tasks owned by this agenda)

#### Event Item Structure

```
╭─────────────────────────────────────────────╮
│ [✓] Finalize Q2 budget                      │ (status indicator + title)
│ 09:00 – 09:30                               │ (time range, independent)
│ Active / Completed / Cancelled              │ (status pill, tappable)
│ [Edit] [Delete from agenda]                 │ (action buttons)
└─────────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| **Status indicator** | ✓ (completed), ✗ (cancelled), ○ (active) — visual symbol |
| **Title** | Agenda event title; can differ from any source calendar event |
| **Time** | "HH:MM – HH:MM" from agenda event's startAt/endAt (independent) |
| **Status pill** | "Active" / "Completed" / "Cancelled"; tappable to change |
| **Source hint** (optional) | Small text: "(from calendar event)" if sourceEventId is set |
| **Actions** | Edit agenda event, Remove from agenda, Delete |

### Agenda Event List Interactions

#### Scroll Down (Load More Future Events)
- Similar to agenda list pagination
- Show loading spinner at bottom
- Fetch next page via `GET /api/agendas/:id/events?limit=20&offset=20`

#### Scroll Up (Load Past Events)
- Fetches past agenda events via `GET /api/agendas/:id/events?direction=backward&limit=20`
- Optionally show sticky button at top: "View past events of this agenda"

#### Tap on Status Pill
- Shows inline dropdown or modal:
  ```
  ○ Active
  ✓ Completed
  ✗ Cancelled
  ```
- On selection: PATCH `/api/agendas/:agendaId/events/:eventId` with new status
- Reflect change immediately in UI (optimistic update)
- Show brief toast: "Event marked as completed" (optional)

#### Long Press or Right-Click (Desktop)
- Context menu with options:
  - Edit agenda event
  - Mark as completed / cancelled
  - Delete from this agenda
  - (Delete agenda event — confirm dialog)

#### Edit Agenda Event
- Tapping Edit button opens event edit modal/screen
- Allows changing title, description, time
- **Key point**: Changes are applied to the agenda event only
- If this agenda event was created from a calendar event, the source calendar event remains unchanged
- On save: PATCH `/api/agendas/:agendaId/events/:eventId`
- Returns to detail view

#### Delete Agenda Event from Agenda
- Tapping Delete or context menu option
- Confirm dialog: "Remove this event from the agenda?"
- On confirm: DELETE `/api/agendas/:agendaId/events/:eventId`
- Agenda event is removed from this agenda
- If sourceEventId exists: Source calendar event remains unchanged
- Agenda event count decreases

#### Add New Agenda Event
- Tap "[+ Add Event]" button
- Opens "Create Agenda Event" modal with two options:
  1. **Create from scratch**: Enter title, description, startAt, endAt
  2. **Add from calendar event**: Select existing calendar event, optionally override title/times
- On save: POST `/api/agendas/:id/events`
- New agenda event appears in list

### States

#### Loading (Initial)
- Skeleton: Agenda metadata section + 3–4 placeholder event rows

#### Empty Event List (No Events in Agenda)
```
No events in this agenda yet.

[+ Create New Event]  [+ Add from Calendar]
```

#### Past Events Loaded (Visual Distinction)
- "Past" section header above events with older startAt
- Optionally: Dim or slightly different styling

#### Error Loading Events
```
Failed to load events. [Retry]
```

### Edit Agenda Modal

Triggered by tapping Edit button on agenda. Modal/dialog with fields:

```
┌─────────────────────────────────────────┐
│ Edit Agenda                     [✕]      │ (header + close)
├─────────────────────────────────────────┤
│ Title *                                 │ (required text field)
│ [Q2 Planning & Review_________]         │
│                                         │
│ Description                             │ (optional textarea)
│ [_____________________________          │
│  _____________________________          │
│  _____________________________]         │
│                                         │
│ Start Date & Time *                     │ (required datetime picker)
│ Mon, Jun 15 • [09:00]                   │
│                                         │
│ End Date & Time *                       │ (required datetime picker)
│ Mon, Jun 15 • [17:00]                   │
│                                         │
│ Status                                  │ (optional dropdown)
│ [Active ▼]                              │
│                                         │
│                    [Cancel]  [Save]     │ (action buttons)
└─────────────────────────────────────────┘
```

#### Validation
- Title: required, max 255 chars
- Start & End: required, endAt >= startAt (enforced on client + server)
- Description: optional
- Status: enum (active, completed, cancelled)

#### On Save
- PATCH `/api/agendas/:id`
- On success: Close modal, return to detail screen, show toast "Agenda updated"
- On error: Show error message, keep modal open for retry

### Create Agenda Event Modal

Triggered by "[+ Add Event]" or "[+ Add from Calendar]" button. Modal with mode selection:

#### Mode 1: Create from Scratch

```
┌──────────────────────────────────────────┐
│ Create Event                    [✕]      │
├──────────────────────────────────────────┤
│ [Create from Scratch] [Add from Calendar]│ (tab/toggle)
├──────────────────────────────────────────┤
│ Title *                                  │
│ [_____________________________]          │
│                                          │
│ Description                              │
│ [_____________________________          │
│  _____________________________]         │
│                                          │
│ Start Date & Time *                      │
│ [Mon, Jun 15] [09:00]                    │
│                                          │
│ End Date & Time *                        │
│ [Mon, Jun 15] [10:30]                    │
│                                          │
│                    [Cancel]  [Create]    │
└──────────────────────────────────────────┘
```

#### Mode 2: Add from Calendar Event

```
┌──────────────────────────────────────────┐
│ Create Event                    [✕]      │
├──────────────────────────────────────────┤
│ [Create from Scratch] [Add from Calendar]│ (tab/toggle)
├──────────────────────────────────────────┤
│ Select Calendar Event *                  │
│ [Search or select calendar event...]     │ (searchable dropdown)
│ Selected: "Team standup" (Jun 15, 9am)   │
│                                          │
│ Override title (optional)                │
│ [Team standup_______]                    │
│                                          │
│ Override time (optional)                 │
│ Start: [Mon, Jun 15] [09:00]             │
│ End:   [Mon, Jun 15] [09:30]             │
│                                          │
│                    [Cancel]  [Add]       │
└──────────────────────────────────────────┘
```

#### Validation
- Title: required, max 255 chars
- Start & End: required, endAt >= startAt
- Calendar event (Mode 2): required, must exist

#### On Create/Add
- Mode 1: POST `/api/agendas/:id/events` with title, description, startAt, endAt
- Mode 2: POST `/api/agendas/:id/events` with sourceEventId and optional overrides
- On success: Close modal, new event appears in list, show toast "Event added"
- On error: Show error message, keep modal open for retry

---

## Cross-Platform Specifics

### Mobile (Expo React Native)

#### Screen Transitions
- **List → Detail**: Push navigation (stack)
- **Detail → Edit Modal**: Modal overlay (doesn't push stack)
- **Back gesture**: Swipe right or tap back button

#### Touch Gestures
- **Scroll up at top**: Pull-to-refresh for agenda list
- **Scroll up for past**: Explicit "View past" button (avoid accidental triggering on nested scroll)

#### Layout
- Full-width cards with padding (16pt margins)
- Font sizes: Title 18pt, subtitle 14pt, metadata 12pt
- Colors: Use system colors (light/dark mode aware)

#### Performance
- Memoize components (FlatList for agenda/event lists)
- Avoid nested FlatLists; use single ScrollView for detail screen
- Lazy-load if applicable

### Desktop (Electron + React + Vite)

#### Window Layout
- Left sidebar: Agenda list (narrow, ~300px)
- Right pane: Agenda detail (wider)
- Header: App title and global controls

#### Keyboard Navigation
- Tab: Move between agenda items, event items
- Enter: Open agenda detail from list or select event action
- Escape: Close modals, return to list
- Ctrl/Cmd + E: Quick edit (optional shortcut)

#### Mouse Interactions
- Click agenda → open detail
- Right-click event → context menu
- Double-click event → edit modal
- Hover: Show action buttons (Edit, Delete) for events

#### Responsive
- Adjust column widths on window resize
- Detail pane collapses if window too narrow (< 800px); becomes modal

---

## Shared Interaction Patterns

### Optimistic Updates

When user changes event status:
1. Update UI immediately (mark event as completed)
2. Fire PATCH request in background
3. On error: Revert UI, show error toast with retry option

Example:
```
User taps "Mark as completed" on agenda event
→ Event row visually updates (checkmark appears)
→ PATCH /api/agendas/:agendaId/events/:eventId
→ On success: Persist change (no additional confirmation)
→ On error: Revert checkmark, show toast "Failed to update event. [Retry]"
```

### Loading States

- **Initial load**: Skeleton screens (shimmer effect)
- **Pagination load**: Spinner at bottom of list
- **Edit/save**: Disable inputs, show spinner while request in flight

### Error Handling

| Scenario | User Feedback |
|----------|---------------|
| Network error (no internet) | "Check your connection and try again" |
| Server error (5xx) | "Something went wrong. [Retry]" |
| Not found (404) | "Agenda not found. It may have been deleted." |
| Validation error (400) | Show specific field error (e.g., "End time must be after start time") |

### Toast Notifications

Brief, dismissable messages for:
- Success: "Agenda created" / "Event added" / "Event marked as completed"
- Error: "Failed to update event"
- Info: "Pulled up to load past agendas"

Duration: 3–4 seconds auto-dismiss; user can swipe to dismiss earlier (mobile)

---

## Accessibility Compliance

### Mobile & Desktop

- **ARIA labels**: All buttons and icons have descriptive labels
- **Keyboard navigation**: All interactive elements reachable via Tab/Shift+Tab
- **Color contrast**:
  - Status badges (Active, Completed, Cancelled): 4.5:1 minimum
  - Text on backgrounds: 4.5:1 (normal text), 3:1 (large text)
- **Focus indicators**: Clear, visible outline on focused elements
- **Text alternatives**: Icons paired with text labels (e.g., "Edit" button with pencil icon)
- **Touch targets**: ≥44x44 pt (iOS) / 48x48 dp (Android)
- **Reduced motion**: Respect prefers-reduced-motion for animations

### Screen Reader Support

Announce:
- Screen title (e.g., "Agenda Detail")
- Agenda metadata: "Q2 Planning, Monday June 15, 9 AM to 5 PM, Active, 5 events"
- Each agenda event: "Finalize Q2 budget, 9 AM to 9:30 AM, Active. Tap to change status or edit."
- Pagination: "Showing 5 of 20 events. Scroll down to load more."

---

## Empty & Error States (Detailed)

### No Future Agendas
```
📅 No upcoming agendas

You don't have any agendas scheduled 
from now onward.

[+ Create New Agenda]

Or swipe up to view past agendas.
```

### No Events in Agenda
```
This agenda has no events yet.

[+ Create New Event]  [+ Add from Calendar]
```

### Failed to Load Agendas
```
⚠️ Failed to load agendas

Check your internet connection and try again.

[Retry]
```

---

## User Flow Diagrams

### Flow 1: Browse Agendas and Manage Agenda Events

```
[Agenda List Screen]
  ↓
  User sees 3 future agendas
  ↓
  [Tap on "Q2 Planning"]
  ↓
  [Agenda Detail Screen]
  ↓
  View agenda metadata + 5 agenda events
  ↓
  [Tap "+ Add Event"]
  ↓
  [Create Agenda Event Modal]
  ↓
  User selects "Add from Calendar" mode
  ↓
  User selects calendar event "Team standup"
  ↓
  System creates new agenda event with title/time copied
  ↓
  [Post to /api/agendas/:id/events with sourceEventId]
  ↓
  New agenda event appears in list
  ↓
  User taps status pill on new event
  ↓
  [Patch /api/agendas/:agendaId/events/:eventId]
  ↓
  Event marked as completed (optimistic)
  ↓
  Toast: "Event marked as completed"
```

### Flow 2: Create Agenda Event from Scratch

```
[Agenda Detail Screen]
  ↓
  [Tap "+ Add Event"]
  ↓
  [Create Agenda Event Modal, "Create from Scratch" mode]
  ↓
  User enters title, times, description
  ↓
  [Tap Create]
  ↓
  [Post to /api/agendas/:id/events with title, startAt, endAt]
  ↓
  New standalone agenda event appears in list
  ↓
  No sourceEventId set; fully independent
```

### Flow 3: Edit Agenda Event

```
[Agenda Detail Screen]
  ↓
  [Tap Edit on agenda event]
  ↓
  [Edit Agenda Event Modal]
  ↓
  User updates title and end time
  ↓
  [Tap Save]
  ↓
  [Patch /api/agendas/:agendaId/events/:eventId]
  ↓
  Event details update in list
  ↓
  If sourceEventId exists: Source calendar event is UNAFFECTED
  ↓
  Toast: "Event updated"
```

### Flow 4: Load Past Agendas

```
[Agenda List Screen]
  ↓
  User at top of future list
  ↓
  [Scroll up / Tap "View Past"]
  ↓
  [Get /api/agendas?direction=backward]
  ↓
  List expands upward showing past agendas
  ↓
  [Tap past agenda]
  ↓
  [Agenda Detail Screen]
  ↓
  Metadata shown + agenda event list (future by default)
  ↓
  [Scroll up in event list]
  ↓
  [Get /api/agendas/:id/events?direction=backward]
  ↓
  Load past agenda events of this agenda
```

---

## Key UX Decisions

| Decision | Rationale |
|----------|-----------|
| **Standalone agenda events** | Each agenda event owns its data (title, time, status). Editing an agenda event doesn't affect any source calendar event. |
| **Copy-on-write for calendar → agenda** | Users can create agenda events from calendar events; data is copied, not linked. Source calendar events remain independent. |
| **Future by default** | Users typically need to see what's coming; past is secondary |
| **Scroll up for past** | Explicit action prevents accidental past-data loads |
| **Server-side pagination** | Handles large datasets efficiently |
| **Optimistic updates for status** | Immediate visual feedback improves perceived responsiveness |
| **Embedded event list in detail** | Reduces navigation friction |
| **Status pills are tappable** | Quick status change without full edit modal |
| **Soft delete on agendas** | Users can recover deleted agendas; audit trail maintained |
| **Hard delete on agenda events** | Simpler; agenda events are task-specific and typically not archived |

---

## Testing Scenarios (QA)

1. **Agenda list pagination**: Load first page (20 agendas), scroll down, verify next 20 load
2. **Past agendas**: From top of list, load past agendas, verify direction=backward query
3. **Create agenda event from scratch**: Add title/time, verify POST to /api/agendas/:id/events
4. **Create agenda event from calendar event**: Select calendar event, verify copy-on-write behavior
5. **Edit agenda event**: Change title and time, verify PATCH and source event unaffected
6. **Delete agenda event**: Remove from agenda, verify source event remains
7. **Change agenda event status**: Mark completed, verify optimistic update and PATCH
8. **Error recovery**: Simulate network error during pagination, verify retry
9. **Empty states**: No agendas, no events, verify messaging
10. **Keyboard navigation (Desktop)**: Tab through, press Enter, verify accessibility
11. **Pull-to-refresh (Mobile)**: Pull down at top, verify refresh
12. **Nested scroll (Mobile)**: Scroll events in detail without closing detail

---

## Notes on Data Model Change (for implementers)

**Visible to users**: Minimal. The term "events" in the UI now refers to "agenda events" (which are standalone), but users don't need to know this distinction.

**Invisible to users but important for implementation**:
- Agenda events are their own table; not a junction table
- Creating an agenda event from a calendar event copies data, doesn't link permanently
- Editing an agenda event has no effect on the source calendar event
- Deleting an agenda event doesn't delete the source calendar event
- The `events` table remains completely unchanged

This design provides:
- **Clean separation of concerns**: Calendar events and agenda events are independent domains
- **Flexible UX**: Users can create agenda events from scratch or from calendar events
- **Independent lifecycle**: Agenda events can be edited/deleted without affecting calendars
- **Future extensibility**: Agenda features can grow without overloading the events table
