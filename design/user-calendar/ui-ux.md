# User Calendar Feature — UI/UX Behavior Design

## Overview

The user calendar feature provides a month-view calendar interface for both mobile (Expo React Native) and desktop (Electron + React). The design prioritizes quick event viewing, creation, and editing with clear visual hierarchy and responsive layouts.

---

## Desktop (Electron + React) Calendar View

### Screen 1: Calendar Grid (Main View)

**Layout & Components:**

1. **Header** (sticky, top of screen)
   - Left: "Previous" button (arrow icon, e.g., `<`)
   - Center: Month/Year label (e.g., "June 2026" in bold 18–20px)
   - Right: "Next" button (arrow icon, e.g., `>`)
   - Space for optional: today button, search/filter, add event button

2. **Weekday Headers** (row of 7 cells)
   - Sun, Mon, Tue, Wed, Thu, Fri, Sat (centered, light gray background)

3. **Calendar Grid** (7 columns × up to 6 rows)
   - Each cell represents one date
   - **Cell design:**
     - Date number in top-left (e.g., "15" in bold, 14–16px)
     - Event list below:
       - First 2–3 event titles (truncated with ellipsis if >30 chars)
       - Start time for timed events (e.g., "2:30 PM", 11–12px, light gray)
       - All-day events prefixed with "[All Day]" or shown without time
     - If >3 events: "+N more" badge in a small pill (e.g., "+2 more")
     - Completed events shown with strikethrough text and 50% opacity
   - **Cell styling:**
     - Today's date: blue ring/border around the cell
     - Other dates in current month: white background
     - Previous/next month dates: very light gray (muted)
     - Hover effect: light blue background + slight shadow

4. **Empty State** (if no events in month)
   - Center of calendar: "No events this month" message with "Add Event" button

**Colors & Typography (Desktop):**
- Today's indicator: Solid blue circle (10px) or ring
- Event title: 12–13px, #333 (dark gray)
- Event time: 11px, #999 (medium gray)
- Completed event: #ccc (light gray), strikethrough
- "+N more" badge: blue background, white text, 10px, rounded

---

### Screen 2: Quick Add Event (Modal Dialog)

**Trigger:** User clicks on an empty date cell

**Modal Design:**
- Title: "Add Event — [Date]" (e.g., "Add Event — June 15, 2026")
- Form fields:
  1. **Title** (text input, required, max 255 chars)
     - Placeholder: "Event title"
     - Auto-focus on dialog open
     - Character counter: "0/255" (bottom-right of input)
  2. **Start Time** (date/time picker)
     - Label: "Starts"
     - Format: "Jun 15, 2026, 2:30 PM" (editable)
     - Default: today at 9:00 AM (or user's clicked date + current time)
  3. **All Day Toggle** (checkbox)
     - Label: "All day event"
     - When checked: Hide/disable time picker, clear endAt
  4. **Reminder** (optional, select dropdown or spinner)
     - Label: "Reminder"
     - Options: "No reminder", "5 minutes before", "15 minutes before", "30 minutes before", "1 hour before", "1 day before"
     - Default: "No reminder"
- Buttons:
  - "Cancel" (gray secondary button, left-aligned)
  - "Save" (blue primary button, right-aligned, disabled if title is empty)

**Validation:**
- Title: required, 1–255 chars (show inline error if empty or too long)
- Start time: required, cannot be in the past (show error if user picks past date)

**Behavior:**
- On "Save": Create event via POST /api/events, close modal, add event to calendar immediately (optimistic update)
- On "Cancel": Close modal without saving, discard changes
- If save fails: Show error message at top of modal ("Failed to create event. Please try again.")

---

### Screen 3: Event Detail & Edit (Modal Dialog)

**Trigger:** User clicks on an event in the calendar

**Modal Design:**
- Title: "Edit Event" (or "View Event" if past)
- Form fields (all optional for update, shown as edit inputs):
  1. **Title** (text input, max 255 chars, required)
  2. **Description** (textarea, optional)
  3. **Start Time** (date/time picker)
  4. **End Time** (date/time picker, optional)
  5. **All Day Toggle** (checkbox)
  6. **Reminder** (select dropdown)
  7. **Completed** (checkbox)
     - Label: "Mark as completed"
     - Can be toggled even for past events
- Buttons:
  - "Delete" (red text button, left-aligned, with trash icon)
  - "Cancel" (gray secondary button)
  - "Save" (blue primary button, disabled if title is empty or no changes made)

**Behavior:**
- **For future events:**
  - All fields are editable
  - "Save" updates via PATCH /api/events/{id}
  - "Delete" shows confirmation modal (see below)
- **For past events:**
  - All fields disabled (read-only view)
  - Show warning banner: "⚠ Past events cannot be edited"
  - "Delete" button is hidden or disabled
  - "Cancel" (or "Close") closes the modal

**Validation:**
- Same as quick add
- End time (if provided) must be >= start time (show error if not)

**Confirmation Modal (Delete):**
- Title: "Delete Event?"
- Message: "Are you sure you want to delete '[Event Title]'? This cannot be undone."
- Buttons:
  - "Cancel" (gray secondary, left)
  - "Delete" (red primary, right)
- On confirm: DELETE /api/events/{id}, close modals, remove from calendar (optimistic update)

---

### Loading & Error States (Desktop)

**Loading Calendar:**
- Skeleton loader: 6 rows × 7 cells of light gray boxes (50px tall each)
- Show for 200–500ms while fetching month's events

**Loading Event Detail:**
- Modal is shown with spinner/loader in center while event is fetching (rarely used, detail usually already in memory)

**Error Loading Events:**
- Banner at top of calendar: "⚠ Failed to load events. Please refresh." with "Retry" button
- Retry calls GET /api/events?year={year}&month={month}

**Error Creating/Updating Event:**
- Modal error banner (red background): "Failed to save event. Please check your input and try again."
- Show specific validation errors inline (e.g., "Title is required")

**Error Deleting Event:**
- Confirmation modal: Show error message and "Try Again" / "Cancel" buttons

---

## Mobile (Expo React Native) Calendar View

### Screen 1: Calendar Grid (Main View)

**Layout & Components:**

1. **Header** (fixed at top, horizontal scrollable month indicator)
   - Left: "Previous" button (arrow, 24px icon)
   - Center: Month/Year (e.g., "June 2026", 16–18px bold)
   - Right: "Next" button (arrow, 24px icon)
   - Spacing: Safe area insets (notch/status bar)

2. **Weekday Headers** (row of 7 cells, each ~14% width)
   - Sun, Mon, Tue, Wed, Thu, Fri, Sat (centered, 12px, light gray)

3. **Calendar Grid** (7 columns × up to 6 rows, scrollable vertically)
   - Each cell: ~51.4vw (width), 60–70px (height)
   - **Cell design:**
     - Date number: top-left, 12px bold, #333
     - Event list: max 1 event line (truncate with ellipsis)
       - Event title (10px, #333)
       - If event has >1 line, show "+N more" badge (9px, blue)
     - Completed events: strikethrough, #999
   - **Gestures:**
     - Tap date cell: Open quick add
     - Tap event: Open detail/edit
     - Long-press event: Show context menu (Edit, Delete, Mark Complete)

4. **Empty State:**
   - Center of screen: "No events this month" with "+" button to add

**Colors & Typography (Mobile):**
- Today: Blue border or circle highlight
- Event: 10px, #333 (dark gray)
- Completed event: #999 (light gray), strikethrough
- "+N more": 9px, blue, uppercase

---

### Screen 2: Quick Add Event (Bottom Sheet)

**Trigger:** User taps an empty date or "+Add" button

**Sheet Design:**
- **Header:** Drag handle (small gray pill at top center), title "Add Event — [Date]"
- **Content (scrollable if needed):**
  1. **Title** (text input, required)
     - Placeholder: "Event title"
     - Keyboard: default
     - Auto-focus
  2. **Start Time** (tap to open date/time picker)
     - Label: "Starts"
     - Display: "Jun 15, 2026, 2:30 PM"
  3. **All Day Toggle** (switch)
     - Label: "All day event"
  4. **Reminder** (select list, optional)
     - Label: "Reminder"
     - Tap to open picker (modal or popover)
  5. **Buttons:**
     - Full-width "Save" button (blue, 44px height)
     - "Cancel" text button below (gray)

**Behavior:**
- Drag handle to close
- Keyboard dismiss button (native iOS/Android keyboard)
- Same validation as desktop
- Optimistic update on save

---

### Screen 3: Event Detail & Edit (Bottom Sheet)

**Trigger:** User taps an event in the calendar or from context menu

**Sheet Design:**
- **Header:** "Edit Event" (or "Event Details" for past)
- **Content (scrollable):**
  1. Title (text input or read-only)
  2. Description (text input or read-only)
  3. Start time (editable or read-only)
  4. End time (editable or read-only)
  5. All day toggle (editable or read-only)
  6. Reminder (editable or read-only)
  7. Completed checkbox (always editable)
- **Buttons:**
  - Full-width "Save" button (if future event)
  - "Delete" button (red text, full-width, if future event)
  - "Cancel" / "Close" text button

**Behavior:**
- Same as desktop (past event warning, delete confirmation)
- Swipe down or tap "X" to close

---

### Loading & Error States (Mobile)

**Loading Calendar:**
- Skeleton loaders in each cell (light gray boxes)
- Show while fetching

**Error:**
- Toast/banner: "Failed to load events. Tap to retry."
- Swipe to dismiss

**Success Messages (optional):**
- Toast: "Event saved" (disappears after 2–3 seconds)

---

## Shared Interaction Patterns

### Date/Time Picker (Both Platforms)

**Desktop:**
- Modal dialog with calendar + time spinners
- Show current selected date/time
- Buttons: "Cancel", "OK"

**Mobile:**
- Native date/time picker (iOS: UIDatePicker, Android: DatePicker + TimePicker)
- Or custom picker if needed

### Month Navigation

**Desktop:**
- Previous/Next buttons always visible
- Disable "Previous" button if at earliest allowed month (e.g., 12 months back)
- Always enable "Next"

**Mobile:**
- Previous/Next buttons with touch-friendly 44px height
- Same disable logic

### Optimistic Updates

**All CRUD operations should update the UI immediately:**
1. User saves event → event appears in calendar right away
2. User deletes event → event vanishes right away
3. User marks complete → strikethrough appears right away
4. If API call fails: Revert the UI change + show error toast

**Implementation:**
- Update local state/cache before awaiting API response
- On error, rollback state and show error message
- Do NOT wait for API response before updating UI

### Real-Time Consistency (NOT in MVP)

Currently, the calendar does NOT auto-refresh when events are created elsewhere. In the future:
- Implement WebSocket connection for real-time updates
- Auto-refresh calendar grid when events change on another device

---

## Accessibility Requirements

### Desktop & Mobile

1. **Keyboard Navigation (Desktop):**
   - Tab: Move between date cells, buttons
   - Enter/Space: Open event/add form
   - Esc: Close modal
   - Arrow keys: Navigate between months

2. **Screen Readers:**
   - Each date cell should have an ARIA label: "June 15, 2 events"
   - Button labels: "Previous month", "Next month", "Add event"
   - Form labels explicitly linked to inputs (label htmlFor)

3. **Color Contrast:**
   - Event text: minimum 4.5:1 contrast with background
   - Completed events: ensure sufficient contrast even at reduced opacity

4. **Touch Targets (Mobile):**
   - Buttons/tappable areas: minimum 44×44 points
   - Date cells: at least 50×50 points
   - Consider larger for elderly/accessibility users

5. **Focus Indicators:**
   - Desktop: visible focus ring (2px blue outline) on keyboard-navigated elements
   - Mobile: native focus styles

---

## Edge Cases & Error Handling

### Scenario 1: User Tries to Edit a Past Event

**Expected Behavior:**
- Modal/sheet opens in read-only mode
- Banner warns: "This event is in the past and cannot be edited"
- Delete, Edit, Start Time buttons are disabled or hidden
- User can still toggle completion or close the modal

### Scenario 2: User Tries to Create an Event with Missing Title

**Expected Behavior:**
- Form shows inline error: "Title is required"
- Save button remains disabled until title is filled
- Validation triggers on blur or on save attempt

### Scenario 3: User Picks an End Time Before Start Time

**Expected Behavior:**
- Form shows error: "End time must be after start time"
- User must correct before saving

### Scenario 4: User Clicks "Previous" Month Many Times

**Expected Behavior:**
- Calendar navigates backward; button disables when reaching earliest allowed month
- User cannot navigate further back

### Scenario 5: Event Save Fails (Network Error)

**Expected Behavior:**
- Modal shows error banner: "Failed to save event. Please try again."
- Form fields remain populated
- User can fix and retry, or cancel to discard

### Scenario 6: Rapid Clicks (User Spam-Clicks Save Button)

**Expected Behavior:**
- Save button is disabled during the API request
- Only one POST is sent, no duplicates

### Scenario 7: User Deletes an Event, Then Undo

**Expected Behavior:**
- No undo button in MVP (it's a destructive action)
- Confirmation modal makes it clear deletion is permanent
- User must manually re-create if they change their mind

### Scenario 8: Many Events on One Date (e.g., 10+)

**Expected Behavior:**
- Show first 2–3 event titles
- Show "+7 more" badge
- User taps the cell or badge to see all events (in a list modal or day view, future enhancement)

### Scenario 9: Very Long Event Title (e.g., 100 chars)

**Expected Behavior:**
- Title truncates to 30–40 chars with ellipsis ("Long title...")
- Full title shown in tooltip (hover on desktop) or in detail modal

---

## Responsive Behavior

### Desktop (Electron)

**Window Sizes:**
- Minimum: 800×600px
- Typical: 1200×800px or larger
- Calendar adjusts cell sizes to fit

**Large Screens (>1400px):**
- Calendar cells are spacious
- Event text is larger (13px)
- More events visible per cell (up to 4–5)

**Smaller Screens (800–1000px):**
- Calendar cells are compact
- Event text is 11px
- Only 2 events visible per cell + "+N more" badge

### Mobile (Expo)

**Portrait Mode:**
- Calendar fills screen width (full-width grid)
- Each cell is ~51.4vw
- Safe area insets considered for notch

**Landscape Mode:**
- Calendar shows but may be compressed
- Consider allowing horizontal scroll or switching to month picker
- Safe area insets for sides

---

## Summary of Key User Flows

| Flow | Trigger | Steps | Result |
|------|---------|-------|--------|
| **View Calendar** | App opens or user navigates to Calendar tab | Calendar loads and shows current month | User sees all events for the month |
| **Navigate Months** | User clicks Previous/Next | Calendar query updates for new month | Calendar animates to new month with its events |
| **Quick Add Event** | User clicks empty date cell | Form modal opens, user fills title + optional details, clicks Save | Event created and appears in calendar immediately |
| **Edit Event** | User clicks event in calendar | Detail modal opens, user edits fields, clicks Save | Event updates and reflects in calendar immediately |
| **Mark Complete** | User toggles completion in event detail or context menu | Checkbox/toggle updates, API call made | Event shows strikethrough and reduced opacity |
| **Delete Event** | User clicks delete button | Confirmation modal appears, user confirms | Event deleted and removed from calendar, confirmation toast shown |

---

## Implementation Notes for Frontend Teams

### Mobile (Expo)

**Dependencies:**
- `expo-calendar` or similar for native date picker (iOS/Android)
- `react-native-gesture-handler` for swipe gestures
- Custom calendar grid component (or use `react-native-calendar-kit`)

**API Client Setup:**
- Use existing `mobile/src/api/events.ts` for CRUD calls
- Implement month-based caching to avoid refetching same month

### Desktop (Electron + React)

**Dependencies:**
- `react-calendar` or build custom calendar grid (simpler)
- `react-hook-form` for form state in modals
- `date-fns` for date manipulation and formatting

**API Client Setup:**
- Use `desktop/src/renderer/api/events.ts` for CRUD calls
- Implement local state management for optimistic updates (Zustand, Redux, or Context)

---

## Constants & Enums to Define

Per the no-hardcode rule, define these in `constants/` directories:

**Backend (NestJS):**
- `REMINDER_OPTIONS` = [0, 5, 15, 30, 60, 1440] (minutes)
- `MAX_EVENT_TITLE_LENGTH` = 255
- `CALENDAR_MONTHS_LOOKBACK` = 12
- `CALENDAR_MONTHS_LOOKAHEAD` = 24

**Mobile:**
- Same constants as backend (re-export or duplicate per project structure)
- `CALENDAR_CELL_HEIGHT` = 70 (pixels)
- `MAX_VISIBLE_EVENTS_PER_CELL` = 3

**Desktop:**
- Same as mobile
- `CALENDAR_CELL_MIN_HEIGHT` = 80
- `CALENDAR_HEADER_HEIGHT` = 60

**Enums:**
- `SortOrder` = { ASC, DESC } (for sorting events within a day)
- `ReminderOption` = { NONE, FIVE_MIN, FIFTEEN_MIN, THIRTY_MIN, ONE_HOUR, ONE_DAY }
