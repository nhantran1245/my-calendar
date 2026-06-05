import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { REMINDER_SCHEDULE_CRON, REMINDER_SCHEDULE_LOOKAHEAD_HOURS } from '../constants';
import { Event } from '../events/event.entity';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /** Re-schedule all upcoming reminders on server boot (handles mid-day restarts). */
  async onModuleInit() {
    await this.scheduleDayReminders();
    await this.catchUpMissedReminders();
  }

  /**
   * Fires reminders that were missed while the backend was down.
   * Targets events whose reminder time has already passed but the event hasn't started yet,
   * and for which no notification was sent or is pending.
   */
  async catchUpMissedReminders() {
    const events = await this.eventsService.findMissedReminders();
    this.logger.log(`Catching up ${events.length} missed reminder(s)`);
    for (const event of events) {
      await this.fireReminder(event);
    }
  }

  /** Runs daily at midnight — loads all events for the next 24 hours and schedules their reminders. */
  @Cron(REMINDER_SCHEDULE_CRON)
  async scheduleDayReminders() {
    const until = new Date(
      Date.now() + REMINDER_SCHEDULE_LOOKAHEAD_HOURS * 3_600_000,
    );
    const events = await this.eventsService.findEventsWithPendingReminders(until);
    this.logger.log(`Scheduling reminders for ${events.length} event(s)`);
    for (const event of events) {
      this.scheduleEventReminder(event);
    }
  }

  /** Registers a named setTimeout for a single event's reminder. */
  scheduleEventReminder(event: Event) {
    if (event.reminderMinutesBefore == null) return;

    const reminderAt = new Date(
      new Date(event.startAt).getTime() - event.reminderMinutesBefore * 60_000,
    );
    const delay = reminderAt.getTime() - Date.now();

    if (delay <= 0) {
      this.logger.warn(
        `Reminder for "${event.title}" skipped — reminder time ${reminderAt.toISOString()} already passed`,
      );
      return;
    }

    // Cancel any previously registered timeout for this event
    this.cancelEventReminder(event.id);

    const timeout = setTimeout(() => this.fireReminder(event), delay);
    this.schedulerRegistry.addTimeout(`reminder-${event.id}`, timeout);

    const delaySec = Math.round(delay / 1000);
    this.logger.log(
      `Reminder scheduled: "${event.title}" fires at ${reminderAt.toISOString()} (in ${delaySec}s)`,
    );
  }

  /** Cancels the scheduled reminder timeout for an event, if one exists. */
  cancelEventReminder(eventId: string) {
    try {
      this.schedulerRegistry.deleteTimeout(`reminder-${eventId}`);
    } catch {
      // Timeout was not registered — safe to ignore
    }
  }

  /** Fires when the scheduled timeout elapses — creates + marks sent the notification. */
  private async fireReminder(event: Event) {
    try {
      const notification = await this.notificationsService.createForEvent(event);
      if (notification) {
        await this.notificationsService.markSent(notification.id);
        this.logger.log(`Notification sent for event "${event.title}" (${event.id})`);
      }
    } catch (err) {
      this.logger.error(`Failed to fire reminder for event ${event.id}`, err);
    }
  }

  // ── EventEmitter2 listeners ─────────────────────────────────────────────────

  @OnEvent('event.saved')
  onEventSaved(event: Event) {
    if (event.reminderMinutesBefore == null) {
      this.cancelEventReminder(event.id);
      return;
    }

    const reminderAt = new Date(
      new Date(event.startAt).getTime() - event.reminderMinutesBefore * 60_000,
    );
    const now = new Date();
    const windowEnd = new Date(
      Date.now() + REMINDER_SCHEDULE_LOOKAHEAD_HOURS * 3_600_000,
    );

    this.logger.log(
      `Event saved: "${event.title}" startAt=${new Date(event.startAt).toISOString()} reminderAt=${reminderAt.toISOString()} now=${now.toISOString()}`,
    );

    if (reminderAt > now && reminderAt <= windowEnd) {
      this.scheduleEventReminder(event);
    } else {
      this.logger.log(
        `Reminder for "${event.title}" outside today's window — cron will pick it up at midnight`,
      );
      this.cancelEventReminder(event.id);
    }
  }

  @OnEvent('event.deleted')
  onEventDeleted({ id }: { id: string }) {
    this.cancelEventReminder(id);
  }
}
