import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node-fetch') as typeof globalThis.fetch;
import { Repository } from 'typeorm';
import { NOTIFICATIONS_SSE_EVENT_NAME, PUSH_NOTIFICATION_TITLE } from '../constants';
import { User } from '../auth/user.entity';
import { Event } from '../events/event.entity';
import { AnalyticsByDayQueryDto } from './dto/analytics-by-day-query.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationStatus } from './enums/notification-status.enum';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a PENDING notification for an event.
   * Returns null if the user has DND active or notifications disabled.
   */
  async createForEvent(event: Event): Promise<Notification | null> {
    if (!event.userId) return null;

    const user = await this.userRepo.findOneBy({ id: event.userId });
    if (!user) return null;
    if (!user.notificationEnabled) return null;
    if (user.dndUntil && user.dndUntil > new Date()) return null;

    try {
      const notification = this.repo.create({
        eventId: event.id,
        userId: event.userId,
        status: NotificationStatus.PENDING,
      });
      return await this.repo.save(notification);
    } catch (err: any) {
      // Unique constraint violation → already exists, skip
      if (err?.code === '23505') return null;
      throw err;
    }
  }

  async markSent(id: string): Promise<void> {
    await this.repo.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    const notification = await this.repo.findOne({
      where: { id },
      relations: { event: true },
    });
    if (!notification) return;

    this.eventEmitter.emit(NOTIFICATIONS_SSE_EVENT_NAME, notification);
    await this.sendExpoPush(notification);
  }

  private async sendExpoPush(notification: Notification): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: notification.userId });
    if (!user?.pushToken) return;

    const isExpoToken = /^ExponentPushToken\[.+\]$/.test(user.pushToken);
    if (!isExpoToken) {
      this.logger.warn(`Invalid Expo push token for user ${user.id}: ${user.pushToken}`);
      return;
    }

    const eventTitle = notification.event?.title ?? 'Upcoming event';

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.pushToken,
          sound: 'default',
          title: PUSH_NOTIFICATION_TITLE,
          body: eventTitle,
          data: { notificationId: notification.id, eventId: notification.eventId },
        }),
      });
      this.logger.log(`Expo push sent to user ${user.id} for "${eventTitle}"`);
    } catch (err) {
      this.logger.error(`Failed to send Expo push for notification ${notification.id}`, err);
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.repo.update(id, {
      status: NotificationStatus.FAILED,
      deliveryError: error,
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOneOwned(id, userId);
    if (notification.isRead) return notification;
    notification.isRead = true;
    notification.readAt = new Date();
    return this.repo.save(notification);
  }

  async dismiss(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOneOwned(id, userId);
    if (notification.isDismissed) return notification;
    notification.isDismissed = true;
    notification.dismissedAt = new Date();
    return this.repo.save(notification);
  }

  async dismissAll(userId: string): Promise<{ dismissedCount: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isDismissed: true, dismissedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('is_dismissed = false')
      .execute();
    return { dismissedCount: result.affected ?? 0 };
  }

  async findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{ data: Notification[]; total: number; skip: number; take: number }> {
    const where: Record<string, unknown> = { userId };

    if (!query.includeDismissed) where.isDismissed = false;
    if (query.status !== undefined) where.status = query.status;
    if (query.isRead !== undefined) where.isRead = query.isRead;

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { event: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.take,
    });

    return { data, total, skip: query.skip, take: query.take };
  }

  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    const count = await this.repo.count({
      where: { userId, isRead: false, isDismissed: false },
    });
    return { unreadCount: count };
  }

  async enableDnd(userId: string, durationMinutes: number): Promise<{ dndUntil: Date; durationMinutes: number }> {
    const dndUntil = new Date(Date.now() + durationMinutes * 60_000);
    await this.userRepo.update(userId, { dndUntil });
    return { dndUntil, durationMinutes };
  }

  async disableDnd(userId: string): Promise<{ dndUntil: null }> {
    await this.userRepo.update(userId, { dndUntil: null });
    return { dndUntil: null };
  }

  async getDndStatus(userId: string): Promise<{ isActive: boolean; dndUntil: Date | null; remainingMinutes: number | null }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const now = new Date();
    const isActive = !!(user.dndUntil && user.dndUntil > now);
    const remainingMinutes = isActive
      ? Math.ceil((user.dndUntil!.getTime() - now.getTime()) / 60_000)
      : null;

    return { isActive, dndUntil: user.dndUntil, remainingMinutes };
  }

  async getAnalyticsSummary(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    totalRead: number;
    totalDismissed: number;
    successRate: number;
    readRate: number;
    dismissRate: number;
    averageTimeToReadSeconds: number | null;
  }> {
    const qb = this.repo
      .createQueryBuilder('n')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN n.status = 'SENT' THEN 1 ELSE 0 END)`, 'totalSent')
      .addSelect(`SUM(CASE WHEN n.status = 'FAILED' THEN 1 ELSE 0 END)`, 'totalFailed')
      .addSelect(`SUM(CASE WHEN n.status = 'PENDING' THEN 1 ELSE 0 END)`, 'totalPending')
      .addSelect(`SUM(CASE WHEN n.is_read = true THEN 1 ELSE 0 END)`, 'totalRead')
      .addSelect(`SUM(CASE WHEN n.is_dismissed = true THEN 1 ELSE 0 END)`, 'totalDismissed')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (n.read_at - n.sent_at))) FILTER (WHERE n.read_at IS NOT NULL AND n.sent_at IS NOT NULL)`,
        'avgTimeToReadSeconds',
      )
      .where('n.user_id = :userId', { userId });

    if (from) qb.andWhere('n.created_at >= :from', { from });
    if (to) qb.andWhere('n.created_at <= :to', { to });

    const raw = await qb.getRawOne();

    const totalSent = parseInt(raw.totalSent ?? '0', 10);
    const totalFailed = parseInt(raw.totalFailed ?? '0', 10);
    const totalPending = parseInt(raw.totalPending ?? '0', 10);
    const totalRead = parseInt(raw.totalRead ?? '0', 10);
    const totalDismissed = parseInt(raw.totalDismissed ?? '0', 10);
    const total = totalSent + totalFailed + totalPending;
    const avgTimeToReadSeconds = raw.avgTimeToReadSeconds != null
      ? parseFloat(raw.avgTimeToReadSeconds)
      : null;

    return {
      totalSent,
      totalFailed,
      totalPending,
      totalRead,
      totalDismissed,
      successRate: total > 0 ? totalSent / total : 0,
      readRate: totalSent > 0 ? totalRead / totalSent : 0,
      dismissRate: totalSent > 0 ? totalDismissed / totalSent : 0,
      averageTimeToReadSeconds: avgTimeToReadSeconds,
    };
  }

  async getAnalyticsByDay(
    userId: string,
    query: AnalyticsByDayQueryDto,
  ): Promise<{ data: Array<{ date: string; sent: number; read: number; dismissed: number; failed: number }> }> {
    const qb = this.repo
      .createQueryBuilder('n')
      .select(`TO_CHAR(n.created_at, 'YYYY-MM-DD')`, 'date')
      .addSelect(`SUM(CASE WHEN n.status = 'SENT' THEN 1 ELSE 0 END)::int`, 'sent')
      .addSelect(`SUM(CASE WHEN n.is_read = true THEN 1 ELSE 0 END)::int`, 'read')
      .addSelect(`SUM(CASE WHEN n.is_dismissed = true THEN 1 ELSE 0 END)::int`, 'dismissed')
      .addSelect(`SUM(CASE WHEN n.status = 'FAILED' THEN 1 ELSE 0 END)::int`, 'failed')
      .where('n.user_id = :userId', { userId })
      .groupBy(`TO_CHAR(n.created_at, 'YYYY-MM-DD')`)
      .orderBy(`TO_CHAR(n.created_at, 'YYYY-MM-DD')`, 'ASC');

    if (query.from) qb.andWhere('n.created_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('n.created_at <= :to', { to: query.to });

    const rows = await qb.getRawMany();
    return { data: rows };
  }

  private async findOneOwned(id: string, userId: string): Promise<Notification> {
    const notification = await this.repo.findOneBy({ id, userId });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    return notification;
  }
}
