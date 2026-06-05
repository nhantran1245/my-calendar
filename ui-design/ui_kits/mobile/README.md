# Cadence — Mobile UI Kit

iPhone-scale recreation of Cadence's core mobile experience. Four screens, hooked up as a real navigable app behind a tab bar, with a new-event sheet that slides up from any screen.

## Screens
- **Month** — calendar grid with busy-day dots and today's pip in ember
- **Day** — hourly grid with positioned events and a live "now" line
- **Agenda** — chronological list grouped by day with serif numerals
- **New event** — bottom sheet with quick attendee / location / repeat rows
- **Settings** — calendar checkboxes + notification toggles (reached via the Me tab)

## Files
- `index.html` — interactive demo (4 phones side-by-side, theme toggle)
- `Components.jsx` — `Icon`, `CadenceTopBar`, `CadenceWeekStrip`, `CadenceEventCard`, `CadenceFab`, `CadenceTabBar`
- `Screens.jsx` — `MonthScreen`, `DayScreen`, `AgendaScreen`, `NewEventSheet`
- `ios-frame.jsx` — iOS device shell (starter component)

## Conventions
- All components reference design tokens (`var(--accent)`, `var(--bg-0)`, etc) from `../../colors_and_type.css` — they re-theme automatically when `<html data-theme>` flips.
- No emoji in any rendered string. Times use 12-hour with lowercase `am`/`pm`. Day headers use serif numerals.
- Iconography is Lucide, drawn inline via the `<Icon name>` component (24 viewBox / 2px stroke).
