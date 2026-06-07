export const REMINDER_OPTIONS = [
  { label: 'No reminder', value: null },
  { label: '5 min before', value: 5 },
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
] as const;

export const MAX_VISIBLE_EVENTS_PER_CELL = 2;
export const MAX_TITLE_LENGTH = 255;
export const MONTHS_LOOKBACK = 12;
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
export const WEEKDAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
export const WEEKDAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const DAY_VIEW_START_HOUR = 6;   // 6am
export const DAY_VIEW_END_HOUR   = 22;  // 10pm
export const DAY_VIEW_HOUR_HEIGHT = 64; // px per hour
export const DAY_VIEW_GUTTER_WIDTH = 52; // px for time label column

export const CELL_HEIGHT = 72;
export const EVENT_PILL_MAX_CHARS = 12;
