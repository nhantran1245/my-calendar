# Analyst Notifications Feature — UI/UX Design

## Overview

The analyst notifications feature introduces a new **Notifications Hub** where users can view, manage, and control their notification preferences across both mobile (Expo React Native) and desktop (Electron + React) platforms. The feature is deeply integrated with the event management flow—reminders are configured at event creation/edit time, and notifications are delivered in real-time to the app and native OS.

---

## Mobile (Expo React Native) — Screen-by-Screen

### Screen 1: Notifications List (Primary Hub)

**Path:** `app/notifications` (using Expo Router file-based routing)

**Purpose:** Central hub showing all incoming notifications. Users can view, read, and dismiss individual or bulk notifications.

#### Layout & Components

```
┌─────────────────────────────────────┐
│ Notifications          [DND Toggle] │  (Header with DND badge if active)
├─────────────────────────────────────┤
│  [x] All                 1 New      │  (Tabs: All, Unread, Dismissed)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [🔔] Team Meeting               ││
│  │      Jun 3, 14:00 — 13:45 sent  ││  (Unread badge)
│  │      [Mark read] [Dismiss] [→]  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [✓] Doctor Appointment          ││
│  │      Jun 2, 15:00 — Jun 2 10:30 ││  (Read, grayed out)
│  │      [Dismiss] [→]              ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [✗] Submit Project Report       ││
│  │      Jun 1, 17:00 — Delivery    ││  (Failed, red icon)
│  │      failed. Tap to retry.      ││
│  │      [Retry] [Dismiss] [→]      ││
│  └─────────────────────────────────┘│
│                                     │
│                   [Dismiss All]     │  (Sticky footer)
│
├─────────────────────────────────────┤
│  Loading indicator (if fetching)    │
│  Empty state (if no notifications)  │
└─────────────────────────────────────┘
```

#### Detailed Interactions

**Notification Card:**
- **Left icon**: Status indicator
  - 🔔 = unread (blue)
  - ✓ = read (gray/muted)
  - ✗ = failed (red)
- **Title & Event Time**: Event title + reminder send time + relative time ("13 mins ago", "2 days ago")
- **Swipe Right**: Auto-dismiss the notification (haptic feedback)
- **Tap Card**: Navigate to event details screen (optional; can also just expand inline)
- **Mark read**: Single tap on unread badge marks as read without navigation
- **Dismiss**: Removes notification from list (soft delete)
- **→ (Navigate)**: Opens event details for that event

**Tabs:**
- **All**: All notifications (unread + read + dismissed if not filtered)
- **Unread**: Only unread, non-dismissed notifications (for quick catch-up)
- **Dismissed**: Notifications user has swiped away (optional, for undo)

**Header Controls:**
- **DND Toggle**: Icon with badge showing DND status ("15 min" / "1 hour" / "OFF")
  - Long-press or tap → opens DND control sheet (see Screen 2)
- **Dismiss All Button**: Bulk-dismiss all unread notifications

#### Loading & Error States

**Loading:**
- Skeleton cards (shimmer effect) while fetching from API
- Pull-to-refresh gesture to manually refetch

**Empty State:**
- Illustration: calendar with checkmark
- Text: "All caught up! No pending notifications."
- Optional: "Create an event with a reminder to get started."

**Delivery Failed:**
- Red icon + message: "Delivery failed. Tap to retry."
- Retry button attempts to resend the notification

**API Error:**
- Toast/banner at top: "Failed to load notifications. Pull to refresh."
- Dismiss button on banner

#### Pagination

- Initial load: 50 notifications
- Infinite scroll: Load next 50 when user scrolls near bottom
- Total count shown in header: "42 notifications"
- User can jump to "Latest" via button (scrolls to top)

#### Real-Time Updates (Optional, Future)

- When new notification arrives from backend (via WebSocket or polling), prepend to list with animation (slide in from top)
- Mark as "1 New" badge near the top
- Optional: Auto-scroll to top to show new notification

#### Accessibility

- Each notification card has ARIA live region (announcement on arrival)
- Swipe right gesture has a spoken action: "Dismiss [Event Title]"
- DND toggle announces status change: "Do Not Disturb enabled for 1 hour"
- Tab navigation: focus moves through cards logically
- Color contrast: unread/read/failed states use sufficient color diff + icons

---

### Screen 2: Do Not Disturb (DND) Control Sheet

**Trigger:** Tap DND badge in notifications list header, or via Settings → Notifications

**Purpose:** Allow user to temporarily mute all notifications without changing event-level settings.

#### Layout & Components

```
┌─────────────────────────────────────┐
│ Do Not Disturb                  [x] │  (Header with close button)
├─────────────────────────────────────┤
│                                     │
│  Do Not Disturb is OFF              │  (Status text)
│  Notifications will be delivered    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Enable DND for:                    │  (Section title)
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ☐  15 minutes                   ││  (Quick options)
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ☐  1 hour                       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ☐  4 hours                      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ☐  Until tomorrow               ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Custom Duration]                  │  (Expandable option)
│  ┌─────────────────────────────────┐│
│  │ Duration: [___] minutes         ││  (Input if custom selected)
│  │           min: 1, max: 1440     ││
│  │ [Enable]                        ││  (Button)
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Disable DND]                   ││  (Button, only shows if DND active)
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### Detailed Interactions

**State: DND OFF (default)**
- Status shows: "Do Not Disturb is OFF"
- Quick option buttons are tappable (radio-style, visual select)
- Tapping an option (e.g., "1 hour") immediately enables DND for that duration
- Sheet closes with success toast: "Do Not Disturb enabled for 1 hour"
- Notifications list header updates with DND badge: "1 hour"

**State: DND ON**
- Status shows: "Do Not Disturb is ON until 14:45" (formatted time)
- Quick options are disabled/grayed out
- "Disable DND" button is enabled and prominent
- Tapping "Disable DND" removes DND immediately
- Toast confirms: "Do Not Disturb disabled"
- Notifications resume normal delivery on next event

**Custom Duration:**
- Expandable section with input field
- User enters 1–1440 minutes (validation: show error if out of range)
- Tap "Enable" to apply
- Or collapse to dismiss

#### Validation & Error Handling

- **Invalid input**: Error message below input: "Duration must be between 1 and 1440 minutes"
- **API error**: Toast at bottom: "Failed to save DND preference. Try again."
- **Success**: Toast: "Do Not Disturb enabled for [duration]"

#### Accessibility

- Radio buttons have labels in native voice-over format
- Input field announces remaining character limit (if applicable)
- Status text announces current DND state on screen load
- Swipe down to dismiss the sheet (modal behavior)

---

### Screen 3: Event Details (Event-Level Reminder Setting)

**Path:** `app/events/[id]` (existing screen, enhanced with notification control)

**Purpose:** Show event details and allow user to configure reminder for this specific event.

#### Changes to Existing Screen

Add a **Reminder Settings** section (if not already present):

```
┌─────────────────────────────────────┐
│ Team Meeting                        │  (Existing event header)
│ Jun 3, 14:00 – 15:00                │
├─────────────────────────────────────┤
│                                     │
│  Description                        │
│  ─────────────────────────────────  │
│  Discuss Q2 roadmap and blockers    │
│                                     │
│  ─────────────────────────────────  │
│  Reminder                           │  (New section)
│  ┌─────────────────────────────────┐│
│  │ Remind me:                      ││
│  │ ◉ 15 minutes before             ││  (Radio buttons)
│  │ ○ 30 minutes before             ││
│  │ ○ 1 hour before                 ││
│  │ ○ 1 day before                  ││
│  │ ○ Never                          ││  (Disables reminders)
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│  [Edit Event] [Complete] [Delete]  │  (Action buttons)
│                                     │
└─────────────────────────────────────┘
```

#### Interactions

- **Tap radio button**: Changes reminder setting immediately (no "Save" button needed—auto-save to backend)
- **Selecting "Never"**: Disables reminders; no notification will be sent for this event
- **Change after event created**: On next reminder cycle (within 60s), the cron picks up the new value
- **Feedback**: Brief toast "Reminder updated to 15 minutes" after selection

#### Notification Status (Optional Indicator)

Below reminder setting, optionally show:
```
  Last notification: Jun 3, 13:45
  Status: Delivered ✓
```

This gives users insight into whether notifications have been sent for this event.

---

## Desktop (Electron + React) — Screen-by-Screen

### Screen 1: Notifications Sidebar Panel

**Location:** Right sidebar in desktop app (width ~350px, collapsed/expanded toggle)

**Purpose:** Persistent, quick-access notification panel visible alongside calendar or event list view.

#### Layout & Components

```
┌────────────────────────────────────┐
│  NOTIFICATIONS           [DND ⏱]   │  (Header)
│  Unread: 5                         │
├────────────────────────────────────┤
│                                    │
│  📅 Team Meeting                   │
│  Jun 3, 14:00  •  2 min ago        │
│  [Dismiss] [Open]                  │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  ✓ Doctor Appointment              │
│  Jun 2, 15:00  •  1 day ago        │
│  [Dismiss] [Open]                  │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  ✗ Submit Report                   │
│  Jun 1, 17:00  •  Delivery failed  │
│  [Retry] [Dismiss] [Open]          │
│                                    │
│  ────────────────────────────────  │
│                                    │
│               [View All]           │  (Footer: expands to full-screen list)
│               [Dismiss All]        │
│                                    │
└────────────────────────────────────┘
```

#### Detailed Interactions

**Notification Card in Sidebar:**
- **Icon**: 📅 (event), ✓ (read/delivered), ✗ (failed)
- **Title + Time**: Event title, relative time ago
- **Dismiss**: Removes from sidebar instantly (soft delete)
- **Open**: Opens event details in main area
- **Hover State**: Card background highlights, buttons become visible
- **Keyboard**: Tab to move focus, Enter to open, Delete to dismiss

**DND Badge:**
- Tap badge → opens DND sheet modal (see below)
- Shows remaining time if active ("45 min")
- Pulsing animation when first enabled (draws attention)

**Collapse/Expand Sidebar:**
- Toggle in the app's top-right corner or via keyboard shortcut (Cmd+Shift+N)
- When collapsed: shows unread count badge on sidebar icon
- On collapse/expand: animation smooth slide

**"View All" Button:**
- Opens full-screen notifications modal or switches to Notifications tab
- Same list as mobile, but in modal/window context

#### Real-Time Updates

- New notifications slide in from top with subtle animation
- Badge count updates instantly ("Unread: 6")
- Optional: Desktop native notification via Electron API (macOS banner) alongside in-app notification

#### Accessibility

- Sidebar is keyboard-navigable (Tab, Shift+Tab, Arrow keys)
- Screen reader announces new notifications: "New notification: Team Meeting"
- High contrast mode respected (Electron native theming)
- Focus ring visible on interactive elements

---

### Screen 2: DND Control (Desktop Modal)

**Trigger:** Click DND badge in sidebar, or Settings → Notifications

**Purpose:** Modal dialog to manage DND mode.

#### Layout & Components

```
┌─────────────────────────────────────┐
│ Do Not Disturb              [  ]    │  (Modal header)
├─────────────────────────────────────┤
│                                     │
│ Status: Do Not Disturb is OFF       │
│                                     │
│ Enable DND for:                     │
│                                     │
│ ┌────────────┐  ┌────────────┐     │
│ │ 15 min     │  │ 1 hour     │     │  (Button grid)
│ └────────────┘  └────────────┘     │
│                                     │
│ ┌────────────┐  ┌────────────┐     │
│ │ 4 hours    │  │ Until      │     │
│ │            │  │ tomorrow   │     │
│ └────────────┘  └────────────┘     │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ Custom Duration:                    │
│ ┌──────────────────┐                │
│ │ [___] minutes    │ [Enable]       │  (Input + button)
│ └──────────────────┘                │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│              [Cancel]  [Disable DND]│  (Footer buttons)
│                                     │
└─────────────────────────────────────┘
```

#### Interactions

- **Quick option buttons**: Tap to immediately enable DND for that duration
- **Custom input**: User types duration, presses Enter or clicks "Enable"
- **Disable DND**: If DND is currently active, this button is visible and prominent
- **Cancel**: Closes modal without changes (Escape key also works)
- **Feedback**: Toast message below modal: "Do Not Disturb enabled for 1 hour"

#### Validation

- Input field validates real-time: "Duration must be 1–1440 minutes"
- Visual feedback: red border on invalid input
- Disable "Enable" button if input is invalid

---

### Screen 3: Notifications List (Full Screen Modal/Tab)

**Trigger:** "View All" button in sidebar, or Notifications menu item

**Purpose:** Comprehensive notifications list with filtering and bulk actions.

#### Layout & Components

```
┌─────────────────────────────────────┐
│ Notifications                   [x] │
├─────────────────────────────────────┤
│  Filters: [All] [Unread] [Failed]   │  (Tabs)
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Team Meeting                    ││  (List items with more details)
│  │ Jun 3, 14:00  •  13:45 sent     ││
│  │ Status: Delivered               ││
│  │ [Dismiss] [Open event]          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Doctor Appointment              ││
│  │ Jun 2, 15:00  •  Read on Jun 2 ││
│  │ Status: Read                    ││
│  │ [Dismiss] [Open event]          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Submit Report                   ││
│  │ Jun 1, 17:00  •  Delivery error ││
│  │ Status: Failed — Try again      ││
│  │ [Retry] [Dismiss] [Open event] ││
│  └─────────────────────────────────┘│
│                                     │
│        [Dismiss All] (sticky bar)   │
│                                     │
└─────────────────────────────────────┘
```

#### Interactions

- **Tabs** (All / Unread / Failed): Filter list by notification state
- **Click card or "Open event"**: Opens event details in a drawer/panel
- **Dismiss**: Removes notification from list
- **Retry** (if failed): Attempts re-delivery
- **Dismiss All**: Bulk-remove all visible notifications
- **Hover state**: Card highlights, action buttons become visible
- **Keyboard**: Arrow keys navigate, Enter to open, Delete to dismiss

#### Sorting & Pagination

- Default sort: newest first (created_at DESC)
- Pagination: shows first 50, "Load more" button at bottom
- Or infinite scroll on large lists

#### Search (Future Enhancement)

- Optional search bar at top: "Search notifications or events..."
- Filters by event title, description, date range

---

### Screen 4: Event Details (Desktop Version)

**Location:** Main area or side panel in desktop app

**Purpose:** Event details with reminder configuration.

#### Layout

```
┌─────────────────────────────────────┐
│ Team Meeting                        │
│ Jun 3, 2026  14:00 – 15:00          │
├─────────────────────────────────────┤
│                                     │
│ Description                         │
│ Discuss Q2 roadmap and blockers     │
│                                     │
│ ─────────────────────────────────  │
│ Reminder                            │
│                                     │
│ ○ Never                             │  (Vertical radio buttons)
│ ○ 5 minutes before                  │
│ ○ 15 minutes before (selected)      │
│ ○ 30 minutes before                 │
│ ○ 1 hour before                     │
│ ○ 1 day before                      │
│                                     │
│ Last notification: Jun 3, 13:45 ✓   │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ [Edit] [Complete] [Delete]         │  (Action buttons)
│                                     │
└─────────────────────────────────────┘
```

#### Interactions

- **Radio button selection**: Auto-saves reminder change (visual feedback: checkmark + toast)
- **Notification status**: Shows when last notification was sent for this event + delivery status
- **Edit button**: Opens event edit dialog
- **Complete/Delete**: Inline actions

---

## Cross-Platform Behaviors

### Real-Time Notification Arrival

#### Mobile (Expo):
1. Backend sends notification via FCM/APNs
2. Native OS notification appears in notification tray (outside app)
3. App receives message via `messaging()` listener
4. If app is in foreground, in-app notification toast appears (slide from top)
5. Notification list auto-refreshes, prepends new notification with animation

#### Desktop (Electron):
1. Backend sends notification via WebSocket or HTTP callback
2. Electron main process shows native macOS notification (if app has focus or in DND)
3. Renderer process receives via IPC
4. In-app notification toast + sidebar badge update
5. Notification list prepends new item, sidebar "Unread" count increments

### Dismissal Gesture Consistency

**Mobile (React Native):**
- Swipe left or right (swipe-to-dismiss pattern)
- Long-press → context menu with dismiss option
- Inline dismiss button

**Desktop (Electron + React):**
- Hover → dismiss button appears
- Delete key when card focused
- Right-click → context menu (Dismiss option)
- Inline dismiss button always visible

### State Synchronization

Both platforms show the same notification data (list, read/dismissed state). However, **multi-device sync is out of scope**:
- If user marks notification as read on mobile, it won't auto-sync to desktop (yet)
- Each device has independent read/dismissed state
- Backend tracks all state changes; analytics are still unified

### Error Recovery

**Network Error (API unreachable):**
- Toast message at top: "Unable to load notifications. Retrying..."
- Auto-retry every 5 seconds (exponential backoff)
- Manual "Retry" button visible
- Eventually: "Connection failed. Check your network." with dismiss option

**Delivery Failed (Push/IPC error):**
- Notification shows status "Failed"
- Red icon, error message visible
- "Retry" button allows user to manually retry delivery
- Backend logs error for debugging

**Rate Limiting:**
- If user taps dismiss rapidly (>5 per second), debounce API calls
- Visual feedback: brief freeze on button, then batch process

---

## Empty States & Onboarding

### Empty Notifications List

**Mobile:**
```
┌─────────────────────────────────────┐
│ Notifications          [DND Toggle] │
├─────────────────────────────────────┤
│                                     │
│            📭                       │
│      All caught up!                 │
│  You have no pending notifications  │
│                                     │
│   💡 Create an event with a          │
│      reminder to get started.       │
│                                     │
│      [Create Event]                 │
│                                     │
└─────────────────────────────────────┘
```

**Desktop:**
```
Same illustration + text, centered in sidebar or modal
```

**Behavior:**
- "Create Event" button links to new event creation screen
- Auto-hide empty state once first notification arrives

### First-Time Onboarding (Optional, Future)

After user creates their first event with a reminder:
- Highlight: "Your notification will appear here in [time]"
- Info card: "Notifications from this app will appear in your notification center"
- Offer quick shortcut: "Go to Settings → Notifications to customize"

---

## Accessibility Features

### Color & Contrast

- **Unread notification**: Bright blue badge + bold text (AA contrast)
- **Read notification**: Gray text, lighter background (AA contrast)
- **Failed notification**: Red icon + text (AA contrast)
- **Dark mode**: Invert colors automatically (system theme detection)

### Keyboard Navigation

**Mobile (React Native):**
- Tab between cards and buttons
- Arrow keys scroll list (standard)
- Space/Enter to select/dismiss
- Screen reader announces notification content in logical order

**Desktop (Electron + React):**
- Full keyboard nav: Tab, Shift+Tab, Arrow keys, Enter, Delete, Escape
- Focus ring always visible (4px border, high contrast)
- Keyboard shortcuts:
  - Cmd+Shift+N: Toggle notifications sidebar
  - D: Dismiss focused notification
  - R: Mark as read
  - O: Open event
  - Escape: Close modal

### Screen Reader Support

- Notification cards marked with `role="article"` and semantic HTML
- Button labels explicit: "Dismiss notification: Team Meeting"
- Icon purposes announced: "Unread indicator", "Failed delivery"
- DND status announced on change: "Do Not Disturb enabled for 1 hour"
- Timestamp relative text: "Team Meeting, 2 minutes ago"

### Motion & Animation Sensitivity

- New notifications animate slide-in (500ms, easing)
- Respects `prefers-reduced-motion` → disables animations, instant state changes
- No auto-play audio

---

## Edge Cases & Error Scenarios

### Scenario 1: Event Deleted After Notification Sent

**Current State:** Notification exists for event_id that's no longer in events table

**Behavior:**
- Notification still displays in list with last-known title ("Team Meeting")
- Tap "Open event" → shows error toast: "Event no longer exists"
- Dismiss button still works (soft delete)
- No cascade delete on notification (data integrity)

**Fix (Future):** Show placeholder "Event was deleted" instead of title, gray out the card

### Scenario 2: User Enables DND, Then Re-Enables Notifications

**Current State:** DND expires at 14:45; user explicitly disables DND at 14:30

**Behavior:**
- DND status becomes inactive immediately
- Next reminder notification is sent normally
- App updates DND badge to OFF

### Scenario 3: Rapid Notification Dismiss (Spam)

**Current State:** User taps dismiss 10 times in 1 second on same notification

**Behavior:**
- First tap dismisses notification (soft delete)
- Subsequent taps are no-ops (already dismissed)
- API returns 404 or 400 (notification already dismissed)
- No error shown to user (graceful degradation)

### Scenario 4: User Offline, Then Comes Online

**Current State:** User was offline for 2 hours; 30 new notifications created

**Behavior:**
- App detects network connection restored
- Auto-fetches latest notifications (pull-to-refresh trigger)
- All 30 appear in list (newest first)
- User can catch up efficiently

### Scenario 5: Notification Delivery Takes >60 Minutes

**Current State:** Notification created but device offline until 2 hours later

**Behavior:**
- Notification remains in `PENDING` state
- Backend retry logic attempts re-delivery every 10 minutes (configurable)
- If device eventually comes online, notification is sent
- User sees it in their notification list as "1 day ago" (based on created_at, not sent_at)

### Scenario 6: User Changes Reminder Setting While Event Is Ongoing

**Current State:** Event started at 14:00, user changes reminder from 15 min to OFF at 14:10

**Behavior:**
- Change is saved to events.reminder_minutes_before
- Notification already sent at 13:45 (doesn't un-send)
- Notification remains in list until dismissed
- Future occurrences of this event (if recurring, future feature) use new reminder value

---

## Performance Considerations

### Mobile (Expo React Native)

- **List rendering**: FlatList with `initialNumToRender=10` and `maxToRenderPerBatch=5` for smooth scrolling
- **Image/icon caching**: Event icons/avatars cached locally (future feature)
- **Bundle size**: Notifications module is code-split, lazy-loaded when sidebar first opened
- **Memory**: Notification list limited to 200 items in memory; older items paginated

### Desktop (Electron + React)

- **Virtualization**: React window or similar for large lists (1000+ notifications)
- **Main process**: Keep IPC messages <50KB, batch updates every 200ms
- **Renderer process**: Debounce list updates to 60fps max
- **Preload context**: No heavy compute in preload.ts

### Backend

- **Query optimization**: Indexes on `(user_id, created_at DESC)` prevent table scans
- **Cron efficiency**: Batch insert notifications for multiple users in single transaction
- **API pagination**: Default 50 per page, max 100
- **WebSocket**: Broadcast new notifications to all connected sessions (not per-device)

---

## Future Enhancements

1. **Notification Sound & Vibration**: Per-event settings (delegate to OS; no custom sounds for now)
2. **Multi-Device Sync**: Mark as read on phone → syncs to desktop (requires session management)
3. **Deep Links**: Tap notification → jump directly to event details (requires URL scheme registration)
4. **Notification Grouping**: "You have 5 upcoming events in the next hour" (single aggregate notification)
5. **Smart Notifications**: ML-based quiet hours detection (don't notify 9 PM – 7 AM)
6. **Notification Templates**: Customizable text, emoji, etc.
7. **Analytics Dashboard**: Chart notifications sent/read/clicked over time
8. **Snooze**: Snooze a notification for 15 min (reshow later)
9. **Notification History Export**: CSV of all notifications (for analytics/audit)
10. **Calendar Integration**: Sync with Apple Calendar, Google Calendar, Outlook (two-way sync future)

---

## Testing Strategy (QA Checklist)

### Functional Tests

- [ ] Create event with reminder → notification arrives at correct time
- [ ] Swipe/tap dismiss → notification removed from list, soft-deleted in DB
- [ ] Mark as read → is_read=true, read_at populated, card grayed out
- [ ] DND 15 min → next notification suppressed, then resumes after 15 min
- [ ] Bulk dismiss all → all unread notifications dismissed
- [ ] Failed notification → retry sends again

### Integration Tests

- [ ] Event reminder time changes → next cron cycle reflects new time
- [ ] User deleted → all notifications cascade-deleted
- [ ] Event deleted → notification still displays (no cascade), deletion succeeds
- [ ] Offline → notifications queue locally, sync when online

### Accessibility Tests

- [ ] Screen reader announces all notification content correctly
- [ ] Full keyboard navigation on desktop (no mouse required)
- [ ] Color contrast verified (AA minimum)
- [ ] Motion disabled → animations respect prefers-reduced-motion

### Performance Tests

- [ ] List of 1000 notifications loads in <2s
- [ ] Scroll through list at 60fps (no jank)
- [ ] Dismiss 100 notifications rapidly (debouncing works, no crashes)
- [ ] Low-end device (Android 5, iPhone 7) handles list smoothly

### Platform-Specific Tests

- **Mobile**: Notification arrives in FCM/APNs tray even if app closed
- **Desktop**: Native macOS notification appears in notification center
- **Cross-platform**: Same data on mobile + desktop (read state, dismissal state independent)
