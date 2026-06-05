/** How many hours ahead the daily scheduler looks when registering reminder timeouts. */
export const REMINDER_SCHEDULE_LOOKAHEAD_HOURS = 24;

/** Cron expression for the daily reminder scheduler (midnight every day). */
export const REMINDER_SCHEDULE_CRON = '0 0 * * *';
