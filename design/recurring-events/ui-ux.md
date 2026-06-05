# Recurring Events Feature — UI/UX Design

## Overview

This section describes the complete user interface and interaction patterns for the recurring-events feature across mobile (Expo React Native) and desktop (Electron + React) platforms.

## Shared Principles

- **Clarity over brevity**: Users must immediately understand whether they're creating a single event or a series
- **Scope confirmation**: Any action affecting multiple instances shows a clear dialog confirming impact
- **Visual indicators**: Recurring instances are marked with an icon (circular arrow ↻) to distinguish them from single events
- **Graceful defaults**: Most users will choose "Daily" or "Weekly" with simple day selection; advanced patterns (monthly relative, yearly) are discoverable but not forced
- **Optimistic updates**: Changes appear immediately in the calendar; errors are shown as inline toast notifications

---

## Mobile (Expo React Native)

### 1. Event Creation Screen — Enhanced

**Location**: Calendar month view → tap empty date → "New Event" bottom sheet

**UX Flow**:
1. User taps a date cell on the calendar
2. A bottom sheet slides up showing "Quick event add" form
3. Fields: Title (required), Start time, All-day toggle
4. At the bottom: "More options" button → navigates to full event form

**Full Event Creation Form** (accessed via "More options" or "+" button):

**Screen Layout** (scrollable):
```
┌─────────────────────────────┐
│ [X] New Event               │  <- Header with close button
├─────────────────────────────┤
│                             │
│ Title *                     │
│ [________________] <- focus │  <- Required field, max 255 chars
│                             │
│ Date & Time                 │
│ ┌─────────────────────────┐ │
│ │ 📅 Mon, Jun 8, 2026    │ │  <- Tappable date picker
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⏰ Start: 7:00 PM      │ │  <- Tappable time picker
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⏰ End: 8:30 PM        │ │
│ └─────────────────────────┘ │
│                             │
│ [X] All-day event          │  <- Checkbox hides time pickers
│                             │
│ Description                 │
│ [_________________________] │
│ [_________________________] │  <- Multi-line text
│ [_________________________] │
│                             │
│ Reminder                    │
│ ┌─────────────────────────┐ │
│ │ ⏱️  15 minutes before  │ │  <- Dropdown: Off, 5, 15, 30, 60, 1440
│ └─────────────────────────┘ │
│                             │
│ Category                    │
│ ┌─────────────────────────┐ │
│ │ Personal              ▼│ │  <- Dropdown: Personal, Work, Health, Deadline
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ↻ Repeat event         │ │  <- NEW: Toggle for recurring
│ └─────────────────────────┘ │
│                             │
│ [When toggled ON below]     │
│                             │
├─────────────────────────────┤
│ Recurrence Settings (collapsed by default, expands on toggle)
│                             │
│ Repeat frequency *          │
│ ◉ Never ◯ Daily ◯ Weekly   │
│ ◯ Monthly ◯ Yearly         │
│                             │
│ [If Weekly selected]        │
│ ┌─────────────────────────┐ │
│ │ Repeat on:              │ │
│ │ ☑️  Mon  ☐ Tue ☑️  Wed │ │
│ │ ☑️  Thu  ☐ Fri ☐ Sat   │ │
│ │ ☐ Sun                   │ │
│ └─────────────────────────┘ │
│                             │
│ [If Monthly selected]       │
│ Repeat on:                  │
│ ◉ Date of month (15th)      │
│ ◯ Day pattern (2nd Tuesday) │
│                             │
│ [If "Day pattern" selected] │
│ ┌─────────────────────────┐ │
│ │ 2nd        ▼| Tuesday ▼│ │
│ └─────────────────────────┘ │
│                             │
│ [If Yearly selected]        │
│ Repeat on:                  │
│ ◉ Same date (Aug 15)        │
│ ◯ Day pattern (2nd Tue Aug) │
│                             │
│ End recurrence *            │
│ ◉ Never                     │
│ ◯ After _ occurrences       │  <- Spinbox or input
│ ◯ On a specific date        │
│                             │
│ [If "On date" selected]     │
│ ┌─────────────────────────┐ │
│ │ 📅 End date: Jun 30...  │ │
│ └─────────────────────────┘ │
│                             │
│ ℹ️ This will create 52 events  <- Calculated instance count
│                             │
├─────────────────────────────┤
│         [Cancel] [Save]     │  <- Buttons with loading state
└─────────────────────────────┘
```

**Interactions**:
- Tapping "Date & Time" opens a date/time picker (native platform behavior)
- Toggling "Repeat event" expands recurrence section
- Selecting frequency (Daily/Weekly/Monthly/Yearly) shows frequency-specific options
- Changing recurrence settings updates the "This will create X events" message in real-time
- If user selects end condition "On a specific date," date picker opens
- "Cancel" closes without saving; "Save" submits (disabled if title is empty)

**Validation & Error States**:
- Title is required; "Save" button disabled until filled
- Start time must be <= end time; error shown inline if violated
- Weekly pattern requires at least one day selected; error shown inline
- Monthly patterns are validated (date 1-31)
- End date must be >= start date; error shown inline
- If pattern would create > 1000 instances, show error: "This recurrence would create too many events (1200 estimated). Please adjust the end date or frequency."

**Loading State**:
- "Save" button shows spinner while request is in flight
- Form is disabled during submission

**Success State**:
- Dismisses the form and returns to calendar
- Calendar shows new instances for the next 12 months
- Toast notification: "Football event created (52 occurrences)"
- Calendar refreshes optimistically; instances appear immediately

---

### 2. Calendar View — Enhanced

**Location**: Tab "Calendar" (default) or main navigation

**UX Changes from Single Events**:
- Each event cell shows an optional badge/icon:
  - **↻ icon** (circular arrow) in the top-right corner of the event cell if it's part of a recurring series
  - For all-day events, badge is shown inline (e.g., "↻ Football")
  - For timed events, icon is shown above the time

**Visual Example**:
```
Mon    Tue    Wed    Thu    Fri    Sat    Sun
30      31     1      2      3      4      5
                            ↻ Football    
                            7:00 PM       
                                       Birthday
                                       (all-day)
6      7      8      9      10     11     12
              ↻ Football
              7:00 PM
```

**Interactions**:
- Tapping an event with the ↻ icon shows the event detail screen (see below)
- Tapping the ↻ icon itself (if tappable area) may optionally show series info in a tooltip
- Long-pressing an event brings up quick actions menu:
  - Edit event (taps through to edit screen)
  - Delete event (shows scope dialog)
  - Mark complete
  - [For recurring instances] View series

---

### 3. Event Detail Screen

**Location**: Tapped from calendar event cell

**Screen Layout**:
```
┌─────────────────────────────┐
│ [<] Event Details           │  <- Back button
├─────────────────────────────┤
│                             │
│ ↻ Football (Weekly series)  │  <- Shows if recurring
│                             │
│ Mon, Jun 8, 2026            │
│ 7:00 PM – 8:30 PM           │
│                             │
│ Description (if any)        │
│ Weekly football game...     │
│                             │
│ 📌 Personal                 │  <- Tag/category
│ ⏱️  30 min before reminder  │
│                             │
│ [Series Info Button]        │  <- Shows recurrence pattern
│ ─────────────────────────── │
│ Repeat: Every Mon, Wed, Fri │
│ Ends: Never                 │
│ Next: Wed, Jun 10, 7:00 PM  │
│                             │
│ ☐ Mark complete            │
│                             │
├─────────────────────────────┤
│      [Edit] [Delete]        │
└─────────────────────────────┘
```

**Interactions**:
- Tapping "Series Info Button" expands/collapses the recurrence pattern details
- Tapping [Edit] navigates to the edit screen (see below)
- Tapping [Delete] shows a scope dialog (see below)
- Tapping "Mark complete" checkbox toggles completion for this instance only

---

### 4. Edit Event Screen

**Location**: Tapped "Edit" from event detail or calendar long-press

**For Single Events**:
- Same form as creation, pre-filled with current data
- Submit is "Save changes" instead of "Save"

**For Recurring Event Instances**:
- Form pre-filled with instance data
- At the top, a scope selector:

```
┌─────────────────────────────┐
│ [X] Edit Event              │
├─────────────────────────────┤
│                             │
│ What would you like to edit?│
│ ◉ This event only          │
│ ◯ This and following events│  <- Only shown for future instances
│ ◯ Entire series            │  <- Only shown if current is at/before series start
│                             │
│ [Continue] or [Cancel]      │
│                             │
└─────────────────────────────┘
```

**Behavior**:
- If the event is in the past, the scope dialog only shows "This event only" but disabled with a message: "Cannot edit past events"
- If the event is today or in the future:
  - "This event only" is always available
  - "This and following" is available
  - "Entire series" is available only if this is the first instance (or user has opened the series template directly)
- Selecting scope and tapping "Continue" shows the edit form
- After editing and saving:
  - **For "This event only"**: The instance is marked `isRecurrenceOverride = true` and appears with a different visual treatment in the calendar (e.g., bold text, different color accent)
  - **For "This and following"**: All instances from this one onward are updated; instances before remain unchanged
  - **For "Entire series"**: All instances are updated; the series template is updated

**Confirmation Dialog**:
Before saving, if scope is "This and following" or "Entire series," show:

```
┌─────────────────────────────┐
│ Update Multiple Events?     │
├─────────────────────────────┤
│                             │
│ You are updating 18 events  │
│ from Jun 10 onward.         │
│                             │
│ [Cancel] [Update]           │
└─────────────────────────────┘
```

---

### 5. Delete Event Dialog

**Trigger**: Tapping [Delete] on event detail or long-press menu

**For Single Events**:
```
┌─────────────────────────────┐
│ Delete Event?               │
├─────────────────────────────┤
│                             │
│ Are you sure you want to    │
│ delete this event?          │
│                             │
│ [Cancel] [Delete]           │
└─────────────────────────────┘
```

**For Recurring Event Instances**:
```
┌─────────────────────────────┐
│ Delete Event?               │
├─────────────────────────────┤
│                             │
│ What would you like to do?  │
│ ◉ Skip this event only      │  <- Removes just this instance
│ ◯ Delete this and following │  <- Removes from this date onward
│ ◯ Delete entire series      │  <- Removes all instances + template
│                             │
│ [Cancel] [Confirm]          │
└─────────────────────────────┘
```

**After Confirmation**:
- For "Skip this event only": Instance disappears from calendar immediately; toast: "Event skipped"
- For "Delete this and following": All instances from this date onward disappear; toast: "X events deleted"
- For "Delete entire series": All instances disappear; toast: "Series and X events deleted"

---

### 6. Recurring Events List Screen

**Location**: Tab "Recurring" or "Series" in main navigation (new tab)

**Screen Layout** (scrollable list):
```
┌─────────────────────────────┐
│ Recurring Events            │  <- Tab title
│ [Filter ▼]                  │  <- Optional filter by frequency
├─────────────────────────────┤
│                             │
│ ↻ Football                  │  <- Series name
│ Every Mon, Wed, Fri         │  <- Pattern description
│ Next: Wed, Jun 10, 7:00 PM  │  <- Next occurrence
│ 52 events (18 remaining)    │  <- Instance count
│                             │  <- Tap to expand or navigate
├─────────────────────────────┤
│                             │
│ ↻ Friend's Birthday         │
│ Every year on Aug 15        │
│ Next: Aug 15, 2027, 12:00 AM│
│ ∞ events (∞ remaining)      │  <- Shows infinity if "Never" ends
│                             │
├─────────────────────────────┤
│ [Empty state if no series]  │
│ No recurring events yet.    │
│ Create one from the         │
│ calendar!                   │
└─────────────────────────────┘
```

**Interactions**:
- Tapping a series expands to show its instances in a sub-list (or navigates to series detail)
- Long-pressing a series shows quick actions: Edit, Delete
- Tapping "Edit" navigates to edit form (editing the series template)
- Tapping "Delete" shows: "Delete entire series? X events will be removed."

**Expanded Series View** (optional, or separate screen):
```
↻ Football - Every Mon, Wed, Fri

[Edit Series] [Delete Series]

Upcoming occurrences:
Jun 10, 7:00 PM
Jun 12, 7:00 PM
Jun 17, 7:00 PM
[+10 more]

Customized occurrences (if any):
Jun 24, 6:00 PM ★ (moved from 7:00 PM)
Jul 1 (skipped)
```

---

## Desktop (Electron + React)

### 1. Event Creation Modal

**Location**: Calendar month view → click empty date or "+" button → modal dialog

**Modal Layout** (dialog, centered on screen, scrollable if content exceeds viewport):
```
┌──────────────────────────────────────────────────────┐
│ Create New Event                                  [X] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Title *                                             │
│ [_____________________________________________]     │
│                                                      │
│ Date & Time                                         │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📅 Monday, June 8, 2026                      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Start: ⏰ 7:00 PM                            │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ End: ⏰ 8:30 PM                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [☑] All-day event                                  │
│                                                      │
│ Description                                         │
│ ┌──────────────────────────────────────────────┐   │
│ │ Weekly football game with friends           │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Reminder: [15 minutes before ▼]                    │
│ Category: [Personal ▼]                              │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ [☑] Repeat event                            │   │ <- NEW
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [RECURRENCE SETTINGS PANEL - EXPANDS BELOW]        │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Repeat Frequency                                    │
│ ◉ Never  ◯ Daily  ◯ Weekly  ◯ Monthly  ◯ Yearly   │
│                                                      │
│ [If Weekly]                                         │
│ Repeat on:                                          │
│ ☑ Mon  ☑ Wed  ☑ Fri  ☐ Other days...             │
│                                                      │
│ [If Monthly]                                        │
│ ◉ 15th of each month                               │
│ ◯ 2nd Tuesday of each month                        │
│ [Dropdown for pattern selection]                   │
│                                                      │
│ [If Yearly]                                         │
│ ◉ August 15 each year                              │
│ ◯ 2nd Tuesday of August each year                  │
│                                                      │
│ End Recurrence                                      │
│ ◉ Never                                             │
│ ◯ After [50] occurrences                           │
│ ◯ On [📅 June 30, 2027]                            │
│                                                      │
│ ℹ️ This will create 52 events                       │
│                                                      │
├──────────────────────────────────────────────────────┤
│                               [Cancel]  [Save] │
└──────────────────────────────────────────────────────┘
```

**Interactions**:
- Clicking "Repeat event" checkbox expands the recurrence settings panel below
- Clicking date fields opens a date picker (popover calendar)
- Clicking time fields opens a time picker
- Radio buttons and checkboxes update recurrence pattern in real-time
- "This will create X events" updates dynamically
- Keyboard: Tab navigates, Enter submits (if Save is focused), Esc cancels

**Validation**:
- Same as mobile, with inline error messages shown below each field
- Save button disabled if validation fails

**Success**:
- Modal closes
- Calendar updates with new instances
- Toast notification in bottom-right: "Football event created (52 occurrences)"

---

### 2. Calendar View — Enhanced

**Location**: Main window, center panel (calendar grid)

**Visual Indicators**:
- Events with recurrence show a small **↻ icon** in the top-left corner of the event cell
- Hover over icon shows a tooltip: "Part of recurring series" or the series name

**Example Calendar Rendering**:
```
Mon       Tue       Wed       Thu       Fri       Sat       Sun
8         9         10        11        12        13        14

        ↻ Football            ↻ Football
          7 PM                  7 PM
                              Birthday
                              (all day)

15        16        17        18        19        20        21

              ↻ Football            ↻ Football
                7 PM                  7 PM
```

**Interactions**:
- Clicking an event navigates to event detail view (right sidebar)
- Right-clicking an event shows context menu:
  - Edit
  - Delete
  - Mark complete
  - View series (if recurring)

---

### 3. Event Detail Sidebar

**Location**: Right panel (typically 300-400px wide), replaces/augments existing detail view

**Layout**:
```
┌──────────────────────────────┐
│ [← Back]                     │
├──────────────────────────────┤
│                              │
│ ↻ Football (Weekly)          │ <- Series indicator
│                              │
│ Monday, June 8, 2026         │
│ 7:00 PM – 8:30 PM            │
│                              │
│ Weekly football game...      │ <- Description
│ (truncated)                  │
│                              │
│ Personal | ⏱️ 30 min         │
│                              │
│ ┌──────────────────────────┐ │
│ │ Series Pattern           │ │
│ │                          │ │
│ │ Every: Mon, Wed, Fri     │ │
│ │ Ends: Never              │ │
│ │ Next: Wed, Jun 10, 7 PM  │ │
│ │ Total: 52 events         │ │
│ │ (18 remaining)           │ │
│ └──────────────────────────┘ │
│                              │
│ ☐ Mark complete             │
│                              │
│ Customization:               │ <- If overridden
│ ★ This instance differs from │
│   the series (moved time)    │
│                              │
├──────────────────────────────┤
│ [Edit] [Delete]              │
└──────────────────────────────┘
```

**Interactions**:
- Clicking [Edit] navigates to edit modal
- Clicking [Delete] shows scope dialog
- Clicking "Series Pattern" section may expand/collapse details or navigate to series view
- Clicking [Mark complete] toggles completion

---

### 4. Edit Event Modal

**Trigger**: Clicking [Edit] from event detail

**For Single Events**:
- Same create modal, pre-filled with existing data
- Submit button reads "Save changes"

**For Recurring Event Instances**:
- Modal header indicates context: "Edit Event Instance"
- First section is a **scope selector** (accordion/collapsible):

```
┌──────────────────────────────────────────────────────┐
│ Edit Event Instance                             [X]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ SCOPE: What would you like to update?               │
│ ─────────────────────────────────────────────────── │
│ ◉ This event only                                   │
│ ◯ This and all following events (Mon, Jun 10+)     │
│ ◯ Entire series                                     │
│                                                      │
│ ─────────────────────────────────────────────────── │
│ Title *                                             │
│ [_____________________________________________]     │
│                                                      │
│ [... rest of form same as create ...]               │
│                                                      │
├──────────────────────────────────────────────────────┤
│                               [Cancel] [Save] │
└──────────────────────────────────────────────────────┘
```

**Behavior**:
- If instance is in the past, all scope options are disabled; only "This event only" is available but read-only with message: "Cannot edit past events"
- If instance is today or future:
  - "This event only" is always selectable
  - "This and following" is available
  - "Entire series" is available if this is the series template or the first instance
- Selecting a scope updates the visual indicator (e.g., bold, color change)
- Save triggers a confirmation dialog if scope is not "This event only"

**Confirmation Dialog** (for multi-instance edits):
```
┌──────────────────────────────────────────────────────┐
│ Update Multiple Events?                         [X]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ You are updating 18 events starting from             │
│ Mon, Jun 10, 2026.                                  │
│                                                      │
│ The following changes will be applied to all:        │
│ • Start time: 7:00 PM → 6:00 PM                    │
│                                                      │
│                               [Cancel] [Update] │
└──────────────────────────────────────────────────────┘
```

---

### 5. Delete Event Dialog

**Trigger**: Clicking [Delete] from event detail

**For Single Events**:
```
┌──────────────────────────────────────────────────────┐
│ Delete Event?                                   [X]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Are you sure you want to delete this event?         │
│                                                      │
│ Football                                            │
│ Monday, June 8, 2026 7:00 PM                        │
│                                                      │
│ This action cannot be undone.                       │
│                                                      │
│                               [Cancel] [Delete] │
└──────────────────────────────────────────────────────┘
```

**For Recurring Event Instances**:
```
┌──────────────────────────────────────────────────────┐
│ Delete Event?                                   [X]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ What would you like to do?                          │
│                                                      │
│ ◉ Skip this occurrence only (Mon, Jun 8)           │
│ ◯ Delete this and all following (Mon, Jun 8+)      │
│ ◯ Delete entire series (all 52 events)             │
│                                                      │
│ This action cannot be undone.                       │
│                                                      │
│                               [Cancel] [Delete] │
└──────────────────────────────────────────────────────┘
```

**Post-Delete**:
- Dialog closes
- Calendar updates (instance(s) disappear)
- Toast notification: "Event skipped" / "X events deleted" / "Series deleted (X events)"

---

### 6. Recurring Events Sidebar / Panel

**Location**: New sidebar tab or expandable section in left panel (navigation)

**View Option 1: Sidebar Panel**
```
┌──────────────────────────────────────┐
│ Recurring Events          [Collapse]  │
│                                      │
│ [Filter: All ▼]                      │
├──────────────────────────────────────┤
│                                      │
│ ↻ Football                           │
│   Every Mon, Wed, Fri                │
│   Next: Wed, Jun 10, 7:00 PM         │
│   52 events (18 remaining)           │
│   [Edit ⋯ Delete]                    │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ ↻ Friend's Birthday                  │
│   Every year on Aug 15               │
│   Next: Aug 15, 2027                 │
│   ∞ events (∞ remaining)             │
│   [Edit ⋯ Delete]                    │
│                                      │
├──────────────────────────────────────┤
│ No recurring events yet              │
│ Create one from the calendar!        │
└──────────────────────────────────────┘
```

**View Option 2: Dedicated Tab / Screen**
- Click "Recurring" tab → opens a new view showing all recurring series
- Larger cards, more details per series
- Can expand each to show upcoming instances

**Interactions**:
- Clicking a series navigates to series detail (right panel or main view)
- Hovering [Edit ⋯] button shows actions: Edit, Duplicate, Delete
- Clicking [Edit] opens the series edit modal
- Clicking [Delete] shows: "Delete entire series? All 52 events will be removed."

**Series Detail View** (when series is selected):
```
┌──────────────────────────────────────┐
│ [← Back] Football Series             │
├──────────────────────────────────────┤
│                                      │
│ Pattern: Every Mon, Wed, Fri         │
│ Start: Mon, Jun 8, 2026, 7:00 PM     │
│ Duration: 1 hour 30 minutes          │
│ Reminder: 30 min before              │
│ Ends: Never                          │
│ Total instances: 52                  │
│ Remaining: 18                        │
│                                      │
│ [Edit Series] [Delete Series]        │
│                                      │
│ Upcoming occurrences:                │
│ ─────────────────────────────────    │
│ Jun 10, 7:00 PM                      │
│ Jun 12, 7:00 PM                      │
│ Jun 17, 7:00 PM                      │
│ Jun 19, 7:00 PM                      │
│ [+14 more]                           │
│                                      │
│ Customized occurrences:              │
│ ─────────────────────────────────    │
│ Jun 24, 6:00 PM ★                    │
│   (Moved from 7:00 PM)               │
│ Jul 1 ★                              │
│   (Skipped)                          │
│                                      │
└──────────────────────────────────────┘
```

---

## Edge Cases & Error Handling

### 1. Creating a Recurring Event with Too Many Instances

**Scenario**: User creates a daily event with no end date (or end date >3 years away)

**Error Display**:
```
[Mobile - Bottom sheet error]
┌─────────────────────────────┐
│ ⚠️ Too Many Events          │
│                             │
│ This pattern would create   │
│ 1,200+ events. Please:      │
│ • Set an end date, or       │
│ • Choose a less frequent    │
│   pattern.                  │
│                             │
│ [Dismiss]                   │
└─────────────────────────────┘

[Desktop - Inline error]
↻ This will create too many events (1,200+)
[i] Adjust the recurrence pattern or add an end date.
```

**Recovery**: User adjusts the pattern and retries.

---

### 2. Attempting to Edit a Past Recurring Event Instance

**Scenario**: User taps "Edit" on a recurring event that occurred 3 months ago

**Behavior**:
- Edit form shows but all fields are disabled
- Message: "This event is in the past and cannot be edited."
- Options: "View series" button or "Close"

---

### 3. Deleting a Series While Viewing an Instance

**Scenario**: User is viewing a single instance, selects "Entire series" in delete dialog, and confirms

**Behavior**:
- Dialog shows: "Delete entire series? This will remove all 52 events."
- After confirming, calendar updates (all instances disappear)
- Sidebar or detail view closes
- Toast: "Series deleted (52 events removed)"

---

### 4. Network Error During Recurring Event Creation

**Scenario**: User creates a weekly recurring event; network fails mid-request

**Behavior**:
- Loading spinner stops
- Error toast appears: "Failed to create recurring event. Please try again."
- Form remains open with data intact
- "Retry" option or user can adjust and resubmit

---

### 5. Recurring Event Pattern Conflict with Timezone

**Scenario**: User creates a yearly event on Feb 29 (leap day); the series extends to non-leap years

**Current Design**: Not in MVP scope (no timezone/DST handling). Events are created as specified; future years without Feb 29 would skip that pattern or move to Mar 1 (backend logic decision).

---

## Accessibility Considerations

### Mobile (Expo)

- **Screen reader support**: All interactive elements have `accessibilityLabel` and `accessibilityHint`
  - Recurrence toggle: "Repeat event, toggle to enable recurring options"
  - Day checkboxes: "Monday, weekday, checked" (state announced)
  - Instance count: "This will create 52 events" (announced after pattern change)
- **Color contrast**: Ensure ↻ icon and overridden event styling meet WCAG AA
- **Touch targets**: All buttons and toggles are >= 44pt
- **Keyboard support**: Form is fully navigable via Tab and virtual keyboard

### Desktop (Electron)

- **Keyboard navigation**: All modals and dialogs support Tab navigation, Esc to close
- **Screen reader**: Modal dialogs announce title and initial focus
- **Color contrast**: All text and icons meet WCAG AA
- **Focus indicators**: Clear outline on focused elements
- **Labels**: All form inputs have associated labels (`<label htmlFor="...">`)

---

## Loading & Optimistic Updates

### Optimistic UI

- **Create recurring event**: Calendar shows new instances immediately; if request fails, instances are removed and error is shown
- **Edit instance**: Updated event details appear immediately in the calendar; if request fails, they revert
- **Delete instance**: Instance is removed from calendar immediately; if request fails, it reappears
- **Mark complete**: Checkbox toggles immediately; if request fails, it reverts

### Loading States

- **During creation/edit**: Form "Save" button shows spinner; form is disabled
- **During deletion**: Dialog buttons are disabled; spinner shown
- **During calendar refresh**: Subtle loading indicator (opacity fade or skeleton) on the calendar
- **During series list load**: Skeleton cards shown for each series position

---

## Empty States

### Mobile

**No events on selected date**:
```
┌─────────────────────────────┐
│ No events today             │
│                             │
│ [+ New Event]               │
└─────────────────────────────┘
```

**No recurring events series**:
```
┌─────────────────────────────┐
│ Recurring Events Tab        │
│                             │
│ No recurring events yet.    │
│ Create one from the         │
│ calendar!                   │
│                             │
│ [← Back to Calendar]        │
└─────────────────────────────┘
```

### Desktop

**Recurring Events sidebar/panel**:
```
┌──────────────────────────────┐
│ Recurring Events             │
│                              │
│ No recurring events yet.     │
│ Create one from the calendar!│
│                              │
└──────────────────────────────┘
```

---

## Responsive Design

### Mobile Breakpoints

- **Small (< 375px)**: Single-column layout, enlarged touch targets
- **Default (375–667px)**: Standard layout as described
- **Large (> 667px)**: Landscape or tablet; may show 2-column layout if space allows

### Desktop Breakpoints

- **Compact (< 1024px)**: Calendar and detail sidebar stack vertically
- **Standard (1024–1440px)**: Calendar + detail sidebar side-by-side
- **Wide (> 1440px)**: Calendar + detail sidebar + recurring series panel (three columns)

---

## Animations & Micro-interactions

- **Expansion/collapse**: 200ms ease-in-out for recurrence settings panel
- **Modal entrance**: Fade + scale-up (100ms)
- **Modal exit**: Fade + scale-down (100ms)
- **Toast notifications**: Slide-in from bottom/right (150ms), auto-dismiss after 3s
- **Checkbox toggle**: 100ms color/state transition
- **Delete confirmation**: Slight red pulse on delete button on hover
- **Calendar instance appearance**: Gentle fade-in (150ms) when added optimistically

---

## Summary Table: Feature Parity

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Create recurring event | ✓ Bottom sheet | ✓ Modal dialog |
| Select frequency (daily/weekly/monthly/yearly) | ✓ | ✓ |
| Configure weekly days | ✓ Checkboxes | ✓ Checkboxes |
| Configure monthly date/pattern | ✓ Radio + dropdown | ✓ Radio + dropdown |
| Configure yearly pattern | ✓ Radio + dropdown | ✓ Radio + dropdown |
| Set end condition | ✓ Radio + input | ✓ Radio + input |
| View instance count before save | ✓ Live update | ✓ Live update |
| View calendar with instances | ✓ | ✓ |
| Edit single instance | ✓ Scope dialog | ✓ Scope modal |
| Edit future instances | ✓ Scope dialog | ✓ Scope modal |
| Edit entire series | ✓ Scope dialog | ✓ Scope modal |
| Delete single instance | ✓ Scope dialog | ✓ Scope dialog |
| Delete future instances | ✓ Scope dialog | ✓ Scope dialog |
| Delete entire series | ✓ Scope dialog | ✓ Scope dialog |
| View recurring series list | ✓ Dedicated tab | ✓ Sidebar or dedicated view |
| Mark instance complete | ✓ Checkbox | ✓ Checkbox |
| Visual indicators (↻ icon) | ✓ Badge | ✓ Icon |
| Overridden instance visual treatment | ✓ Bold/color | ✓ Bold/color or ★ marker |
| Optimistic UI updates | ✓ | ✓ |
| Error handling with retry | ✓ Toast | ✓ Toast |
