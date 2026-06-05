export const REMINDER_OPTIONS = [
  { label: 'No reminder', value: null },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
] as const;

export const MAX_VISIBLE_EVENTS_PER_CELL = 3;
export const MAX_TITLE_LENGTH = 255;
export const CALENDAR_MONTHS_LOOKBACK = 12;
export const MONTHS_LOOKBACK = 12;
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
export const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
