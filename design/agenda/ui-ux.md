# Agenda Feature — UI/UX Design

## Overview

The Agenda feature provides two main screens across both mobile (Expo React Native) and desktop (Electron + React) platforms:

1. **Agenda List Screen**: Chronological view of agendas (future by default, past on scroll-up)
2. **Agenda Detail Screen**: Full agenda metadata + paginated event list with status management

Both platforms share the same interaction model but adapt layout and gestures to their native conventions.

---

## Agenda List Screen

### Purpose

Displays upcoming agendas in chronological order, allowing users to browse, search, and drill into details.

### Default Behavior

- **Initial view**: Shows future agendas (startAt >= now), sorted by startAt ascending
- **Sort order**: Oldest-to-newest (events/agendas from today forward)
- **Pagination**: Server-side; loads first page (20 items) on mount
- **Scroll direction**: 
  - Scroll **down** → load more future agendas
  - Scroll **up** → load past agendas (requires user intent, see interaction details)

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
│  [Loading more...] or [Load next page]  │ (pagination control, if needed)
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
| **Event count** | "5 events" | Number of events in agenda |
| **Description preview** | First 60 chars of description (if exists) | Optional; ellipsis if truncated |

### Interactions

#### Scroll Down (Load Future)
- User scrolls to bottom of list
- Condition: `hasMore === true` in pagination metadata
- Action: Fetch next page (offset += limit)
- Loading state: Spinner or skeleton at bottom of list
- Error handling: Show "Failed to load more" toast with retry button

#### Scroll Up (Load Past)
- User scrolls to very top of list
- Condition: Must pass a threshold (e.g., scroll offset == 0) to trigger "reveal past" UI
- Presentation options:
  - **Option A (Recommended)**: Show sticky "Tap to load past" button at top of list
  - **Option B**: Auto-load on scroll-up past threshold
- Action: Fetch agendas with `direction=backward` and appropriate timestamp filter
- Loading state: Skeleton rows inserted at top
- Transition: Agendas appear above current list with visual distinction (e.g., dimmed or grouped under "Past" header)

#### Tap on Agenda Item
- Navigate to Agenda Detail screen
- Pass agenda ID as route parameter
- Preserve scroll position for back navigation (if platform supports it)

#### Tap on Status Badge (Optional)
- Quick status change without navigating to detail
- Shows inline dropdown: [Active] [Completed] [Cancelled]
- On selection: PATCH agenda status, reflect change immediately
- (Defer to Phase 2 if complexity concerns)

#### Refresh/Pull-to-Refresh (Mobile)
- Pull down at top of list to refresh future agendas
- Clears pagination offset, refetches from start
- Show refresh spinner at top
- Return to original scroll position (or top) after refresh

#### Filter/Search (Phase 2)
- Not in MVP; defer filtering by status, date range, or search text

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

#### Empty Past (When Scrolling to Past)
```
You've reached the beginning. No agendas before this date.
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

Shows full agenda information and a paginated, manageable list of events within that agenda.

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
│  Events (5 total)                       │ (section header)
│  ─────────────────────────────────────  │
│                                         │
│  ╭─────────────────────────────────────╮│ (future events by default)
│  │ ✓ Team standup                      ││ (event, with status indicator)
│  │ 09:00 – 09:30                       ││ (time)
│  │ ○ Active                            ││ (status pill; tap to change)
│  └─────────────────────────────────────┘│
│  ╭─────────────────────────────────────╮│
│  │ All-hands meeting                   ││
│  │ 10:00 – 10:45                       ││
│  │ ○ Active                            ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Load more events...] or pagination    │
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
| **Location** (optional, Phase 2) | If location field added to schema |

### Event List Section

#### Default Behavior
- Shows **future events** of the agenda (startAt >= now), sorted by startAt ascending
- Paginated (20 items per page)
- Scrollable within the detail screen (nested scroll on mobile requires care)

#### Event Item Structure

```
╭─────────────────────────────────────────────╮
│ [✓] Team standup                            │ (status indicator + title)
│ 09:00 – 09:30                               │ (time range)
│ Active / Completed / Cancelled              │ (status pill, tappable)
│ [Edit] [Delete]                             │ (action buttons, optional)
└─────────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| **Status indicator** | ✓ (completed), ✗ (cancelled), ○ (active) — visual symbol |
| **Title** | Event title; truncate if needed |
| **Time** | "HH:MM – HH:MM" or "All day" |
| **Status pill** | "Active" / "Completed" / "Cancelled"; tappable to change |
| **Actions** | Edit (optional in MVP) and Remove from agenda (or contextual menu) |

### Event List Interactions

#### Scroll Down (Load More Future Events)
- Similar to agenda list pagination
- Show loading spinner at bottom
- Fetch next page with `limit` and `offset`

#### Scroll Up (Load Past Events)
- Scrolls within the event list to reveal past events of this agenda
- Fetch previous events with `direction=backward`
- Optionally show sticky button at top: "View past events of this agenda"

#### Tap on Status Pill
- Shows inline dropdown or modal:
  ```
  ○ Active
  ✓ Completed
  ✗ Cancelled
  ```
- On selection: PATCH /events/:id/status with new status
- Reflect change immediately in UI (optimistic update)
- Show brief toast: "Event marked as completed" (optional confirmation)

#### Long Press or Right-Click (Desktop)
- Context menu with options:
  - Edit event
  - Mark as completed / cancelled
  - Remove from this agenda
  - (Delete event — careful: confirm dialog needed)

#### Edit Event (Optional in MVP)
- Tapping Edit button opens event edit modal/screen
- Allows changing title, time, description
- On save: PATCH /events/:id
- Returns to detail view

#### Remove Event from Agenda
- Tapping Remove or context menu option
- Confirm dialog: "Remove this event from the agenda?"
- On confirm: DELETE /agendas/:agendaId/events/:eventId
- Event is removed from list but not deleted from system
- Agenda event count decreases

### States

#### Loading (Initial)
- Skeleton: Agenda metadata section + 3–4 placeholder event rows

#### Empty Event List (No Events in Agenda)
```
No events in this agenda yet.

[Create Event] or [Add Event] button
```

#### Past Events Loaded (Visual Distinction)
- Agendas have "Past" section header above events with older startAt
- Optionally: Dim or slightly different styling

#### Error Loading Events
```
Failed to load events. [Retry]
```

### Edit Agenda Modal

Triggered by tapping Edit button. Modal/dialog with fields:

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
- Start & End: required, endAt > startAt (enforced on client + server)
- Description: optional, max 1000 chars
- Status: enum (active, completed, cancelled)

#### On Save
- PATCH /agendas/:id with updated fields
- On success: Close modal, return to detail screen, show toast "Agenda updated"
- On error: Show error message, keep modal open for retry

---

## Cross-Platform Specifics

### Mobile (Expo React Native)

#### Screen Transitions
- **List → Detail**: Push navigation (stack)
- **Detail → Edit Modal**: Modal overlay (doesn't push stack)
- **Back gesture**: Swipe right or tap back button

#### Touch Gestures
- **Scroll up at top**: Pull-to-refresh (standard iOS/Android pattern)
- **Scroll up for past**: If implementing bidirectional scroll, require explicit "View past" button to avoid accidental triggering

#### Layout
- Full-width cards with padding (16pt margins)
- Font sizes: Title 18pt, subtitle 14pt, metadata 12pt
- Colors: Use system colors (light/dark mode aware)

#### Performance
- Lazy-load event images/avatars if applicable
- Memoize components (FlatList for agenda/event lists)
- Avoid nested FlatLists; use single ScrollView for detail screen

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
- Detail pane collapses if window too narrow (< 800px); becomes modal/overlay

---

## Shared Interaction Patterns

### Optimistic Updates

When user changes event status:
1. Update UI immediately (mark event as completed)
2. Fire PATCH request in background
3. On error: Revert UI, show error toast with retry option

Example:
```
User taps "Mark as completed" on event
→ Event row visually updates (checkmark appears)
→ PATCH request fires
→ On success: Persist change (no additional confirmation needed)
→ On error: Revert checkmark, show toast "Failed to update event. [Retry]"
```

### Loading States

- **Initial load**: Skeleton screens (shimmer effect)
- **Pagination load**: Spinner at bottom of list or loading more text
- **Edit/save**: Disable inputs and show spinner while request in flight

### Error Handling

| Scenario | User Feedback |
|----------|---------------|
| Network error (no internet) | "Check your connection and try again" |
| Server error (5xx) | "Something went wrong. [Retry]" |
| Not found (404) | "Agenda not found. It may have been deleted." |
| Validation error (400) | Show specific field error (e.g., "End time must be after start time") |
| Conflict (409) | "This change conflicts with recent updates. Please refresh." |

### Toast Notifications

Brief, dismissable messages for:
- Success: "Agenda created" / "Event marked as completed"
- Error: "Failed to update agenda"
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
- **Focus indicators**: Clear, visible outline on focused elements (not just color change)
- **Text alternatives**: Icons paired with text labels (e.g., "Edit" button with pencil icon)
- **Touch targets**: ≥44x44 pt (iOS) / 48x48 dp (Android)
- **Reduced motion**: Respect prefers-reduced-motion for animations (fade instead of slide, no shimmer on skeleton)

### Screen Reader Support

Announce:
- Screen title (e.g., "Agenda Detail")
- Agenda metadata: "Q2 Planning, Monday June 15, 9 AM to 5 PM, Active, 5 events"
- Each event: "Team standup, 9 AM to 9:30 AM, Active. Tap to change status or edit."
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

### No Past Agendas (When Scrolling Up)
```
You've reached the beginning.

No earlier agendas found.

[Return to Future]
```

### Failed to Load Agendas
```
⚠️ Failed to load agendas

Check your internet connection and try again.

[Retry]
```

### No Events in Agenda Detail
```
This agenda has no events yet.

[+ Add Event]  or [+ Create New Event]
```

---

## User Flow Diagrams

### Flow 1: Browse Future Agendas and View Details

```
[Agenda List Screen]
  ↓
  User sees 3 future agendas
  ↓
  [Scroll down]
  ↓
  Fetch next 5 agendas
  ↓
  [Tap on "Team Offsite Dinner"]
  ↓
  [Agenda Detail Screen]
  ↓
  View agenda metadata + 5 events
  ↓
  [Tap "Completed" status pill on event]
  ↓
  Event marked as completed (optimistic)
  ↓
  PATCH request succeeds
  ↓
  Toast: "Event marked as completed"
```

### Flow 2: Load Past Agendas

```
[Agenda List Screen]
  ↓
  User at top of future list
  ↓
  [Scroll up / Tap "View Past"]
  ↓
  Fetch agendas with direction=backward
  ↓
  List expands upward showing past agendas
  ↓
  [Tap past agenda]
  ↓
  [Agenda Detail Screen]
  ↓
  Metadata shown + event list (future by default)
  ↓
  [Scroll up in event list]
  ↓
  Load past events of this agenda
```

### Flow 3: Edit Agenda

```
[Agenda Detail Screen]
  ↓
  [Tap Edit button]
  ↓
  [Edit Agenda Modal]
  ↓
  User updates title and end time
  ↓
  [Tap Save]
  ↓
  PATCH /agendas/:id
  ↓
  On success: Modal closes, detail screen updates
  ↓
  Toast: "Agenda updated"
```

---

## Real-Time & Polling Considerations

### Polling Strategy (MVP)

Not implemented in MVP. For Phase 2+:
- Client polls /api/agendas every 30–60 seconds for changes
- Or: Implement WebSocket events for agenda/event updates (if other parts of app use it)

### Notification Integration

When agenda/event status changes:
- Local notification (mobile): "Event 'Team standup' marked as completed"
- Desktop notification: Similar, via IPC to Electron main process
- (Defer to Phase 2 if low priority)

---

## Summary of Key UX Decisions

| Decision | Rationale |
|----------|-----------|
| **Future by default** | Users typically need to see what's coming; past is secondary |
| **Scroll up for past** | Explicit action prevents accidental past-data loads; intuitive (scroll backward in time) |
| **Server-side pagination** | Handles large datasets; avoids memory bloat on client |
| **Optimistic updates for status** | Immediate visual feedback improves perceived responsiveness |
| **Embedded event list in detail** | Reduces navigation friction; one less screen to load |
| **Status pills are tappable** | Quick status change without drilling into edit modal |
| **Soft delete (not hard)** | Users can recover deleted agendas; audit trail maintained |
| **Same interaction on mobile & desktop** | Consistent mental model across platforms |

---

## Testing Scenarios (QA)

1. **List pagination**: Load first page (20 agendas), scroll down, verify next 20 load correctly
2. **Past agendas**: From top of list, load past agendas, verify direction=backward query
3. **Event status change**: From detail screen, tap event status, verify PATCH request and UI update
4. **Edit agenda**: Change title and end time, save, verify PATCH request and detail screen refresh
5. **Error recovery**: Simulate network error during pagination, verify retry button works
6. **Empty states**: Create agenda with 0 events, verify "No events" message; delete all agendas, verify "No upcoming" message
7. **Keyboard navigation (Desktop)**: Tab through agenda items, press Enter to open detail, Tab through event items, press Enter to change status
8. **Mobile pull-to-refresh**: Pull down at top of agenda list, verify refresh
9. **Nested scroll (Mobile)**: Scroll events within detail screen without accidentally closing detail
10. **Accessibility**: Run axe or similar tool; verify color contrast, focus indicators, ARIA labels

