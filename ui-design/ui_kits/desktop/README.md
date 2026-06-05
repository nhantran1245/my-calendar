# Cadence — Desktop UI Kit

Full Cadence desktop app: nav rail, sidebar (mini-calendar + calendar list), week & month views, event inspector, and ⌘K quick-add modal.

## Screens
- **Week view** — 7-column hour grid with positioned events, a live "now" line on today's column
- **Month view** — 6-row grid with up to 3 events per cell + overflow count
- **Event inspector** — right-side detail panel that slides in when you click an event
- **Quick-add modal** — center-screen ⌘K dialog with natural-language parsing & live chip preview

## Files
- `index.html` — interactive demo (try clicking events, switching views, pressing ⌘K)
- `Components.jsx` — `NavRail`, `AppHeader`, `Segmented`, `MiniCalendar`, `CalendarList`, `SmallIconButton`, `DesktopIcon`
- `Screens.jsx` — `WeekView`, `MonthView`, `EventInspector`, `QuickAddModal`
- `browser-window.jsx` — desktop window chrome (starter component, not used by default — wrap the app in `<ChromeWindow>` if you want a macOS frame for marketing shots)

## Interactions
- ⌘K (or Ctrl-K) — opens quick-add
- Click any event — opens the inspector panel
- Esc — closes quick-add or inspector
- View segmented control — switches between Day / Week / Month
- Sidebar calendar checkboxes — toggle filter state

## Conventions
- Theme-aware throughout: flip `<html data-theme="dark">` and every component re-themes via tokens.
- 64px nav rail, 240px sidebar, fluid main area, 340px inspector when open.
- Events placed in absolute coords against a 56px-per-hour grid; height auto-derived from start/end.
