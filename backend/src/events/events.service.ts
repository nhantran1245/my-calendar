import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SortOrder } from './enums/sort-order.enum';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Returns all non-template events whose start_at falls within the given calendar month,
   * ordered by start_at ASC. Optionally filters out completed events.
   */
  findByMonth(
    year: number,
    month: number,
    includeCompleted: boolean,
  ): Promise<Event[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const where: Record<string, unknown> = {
      startAt: Between(start, new Date(end.getTime() - 1)),
      isRecurrenceTemplate: false,
    };

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    return this.repo.find({
      where,
      order: { startAt: SortOrder.ASC },
    });
  }

  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    const event = this.repo.create({ ...dto, userId } as unknown as Partial<Event>);
    const saved = await this.repo.save(event);
    this.eventEmitter.emit('event.saved', saved);
    return saved;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.repo.findOneBy({ id });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    if (new Date(event.startAt).getTime() < Date.now()) {
      throw new BadRequestException('Cannot edit events in the past');
    }

    Object.assign(event, dto);
    const saved = await this.repo.save(event);
    this.eventEmitter.emit('event.saved', saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.repo.remove(event);
    this.eventEmitter.emit('event.deleted', { id });
  }

  async toggleComplete(id: string, isCompleted: boolean): Promise<Event> {
    const event = await this.findOne(id);
    event.isCompleted = isCompleted;
    const saved = await this.repo.save(event);
    if (isCompleted) {
      this.eventEmitter.emit('event.deleted', { id });
    }
    return saved;
  }

  /**
   * Returns events whose reminder time has already passed but whose start time
   * is still in the future, and for which no SENT or PENDING notification exists.
   * Used on startup to fire reminders that were missed while the backend was down.
   */
  findMissedReminders(): Promise<Event[]> {
    const now = new Date();
    return this.repo
      .createQueryBuilder('e')
      .where('e.reminderMinutesBefore IS NOT NULL')
      .andWhere('e.isCompleted = false')
      .andWhere('e.isRecurrenceTemplate = false')
      .andWhere(
        "(e.startAt - (e.reminderMinutesBefore * interval '1 minute')) <= :now",
        { now },
      )
      .andWhere('e.startAt > :now', { now })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.event_id = e.id
            AND n.status IN ('SENT', 'PENDING')
        )`,
      )
      .getMany();
  }

  /**
   * Returns events whose reminder time falls between now and `until`.
   * Excludes templates — only actual event instances trigger reminders.
   */
  findEventsWithPendingReminders(until: Date): Promise<Event[]> {
    const now = new Date();
    return this.repo
      .createQueryBuilder('e')
      .where('e.reminderMinutesBefore IS NOT NULL')
      .andWhere('e.isCompleted = false')
      .andWhere('e.isRecurrenceTemplate = false')
      .andWhere(
        "(e.startAt - (e.reminderMinutesBefore * interval '1 minute')) > :now",
        { now },
      )
      .andWhere(
        "(e.startAt - (e.reminderMinutesBefore * interval '1 minute')) <= :until",
        { until },
      )
      .getMany();
  }
}
