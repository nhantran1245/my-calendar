import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import {
  MAX_RECURRENCE_INSTANCES,
  RECURRENCE_GENERATION_MONTHS,
} from '../constants';
import { CreateRecurringEventDto } from './dto/create-recurring-event.dto';
import { QueryRecurringEventsDto } from './dto/query-recurring-events.dto';
import { QueryRecurringInstancesDto } from './dto/query-recurring-instances.dto';
import { UpdateRecurringEventDto } from './dto/update-recurring-event.dto';
import { Event } from './event.entity';
import { RecurrenceEndType } from './enums/recurrence-end-type.enum';
import { RecurrenceFrequency } from './enums/recurrence-frequency.enum';
import { UpdateScope } from './enums/update-scope.enum';
import { EventTag } from './enums/event-tag.enum';

const DAY_NAMES_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES_FULL = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getUTCMonth() + months;
  result.setUTCMonth(targetMonth);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Find the Nth weekday in a given month.
 * patternValue examples: "2nd_tuesday", "last_friday", "1st_monday"
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  timeHours: number,
  timeMinutes: number,
  timeSeconds: number,
  patternValue: string,
): Date {
  const parts = patternValue.split('_');
  const ordinalStr = parts[0]; // "1st", "2nd", "3rd", "4th", "last"
  const dayName = parts.slice(1).join('_'); // "tuesday", "monday"
  const targetDayIndex = DAY_NAMES_FULL.indexOf(dayName);

  const daysInMonth = getDaysInMonth(year, month);

  if (ordinalStr === 'last') {
    for (let d = daysInMonth; d >= 1; d--) {
      const date = new Date(Date.UTC(year, month, d, timeHours, timeMinutes, timeSeconds));
      if (date.getUTCDay() === targetDayIndex) {
        return date;
      }
    }
  } else {
    const ordinalMap: Record<string, number> = {
      '1st': 1,
      '2nd': 2,
      '3rd': 3,
      '4th': 4,
    };
    const ordinal = ordinalMap[ordinalStr];
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, month, d, timeHours, timeMinutes, timeSeconds));
      if (date.getUTCDay() === targetDayIndex) {
        count++;
        if (count === ordinal) {
          return date;
        }
      }
    }
  }

  // Fallback: should not happen for valid patterns
  throw new BadRequestException(`Invalid monthly relative pattern: ${patternValue}`);
}

/**
 * Generate all occurrence dates for a recurring event within the generation window.
 * Returns an array of UTC dates (each representing the start of an occurrence).
 */
function generateOccurrenceDates(
  startAt: Date,
  frequency: RecurrenceFrequency,
  pattern: Record<string, unknown> | null,
  endType: RecurrenceEndType,
  endValue: string | null,
  generationUntil: Date,
): Date[] {
  const maxOccurrences =
    endType === RecurrenceEndType.AFTER_OCCURRENCES
      ? parseInt(endValue!, 10)
      : MAX_RECURRENCE_INSTANCES;

  const endDate =
    endType === RecurrenceEndType.ON_DATE
      ? new Date(Math.min(new Date(endValue!).getTime(), generationUntil.getTime()))
      : generationUntil;

  const dates: Date[] = [];
  const h = startAt.getUTCHours();
  const m = startAt.getUTCMinutes();
  const s = startAt.getUTCSeconds();

  if (frequency === RecurrenceFrequency.DAILY) {
    let current = new Date(startAt);
    while (current <= endDate && dates.length < maxOccurrences) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }
  } else if (frequency === RecurrenceFrequency.WEEKLY) {
    const days = (pattern?.days as string[]) ?? [];
    let current = new Date(startAt);
    // Start from the beginning of the first day to capture all days that week
    // Walk day by day starting from startAt
    while (current <= endDate && dates.length < maxOccurrences) {
      const dayShort = DAY_NAMES_SHORT[current.getUTCDay()];
      if (days.includes(dayShort)) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
  } else if (frequency === RecurrenceFrequency.MONTHLY) {
    const pat = pattern as { type: 'date' | 'relative'; value: number | string };
    let current = new Date(startAt);
    while (current <= endDate && dates.length < maxOccurrences) {
      dates.push(new Date(current));
      // Advance to next month
      const nextYear = current.getUTCFullYear();
      const nextMonth = current.getUTCMonth() + 1;
      const adjustedYear = nextYear + Math.floor(nextMonth / 12);
      const adjustedMonth = nextMonth % 12;

      if (pat.type === 'date') {
        const targetDay = pat.value as number;
        const daysInNextMonth = getDaysInMonth(adjustedYear, adjustedMonth);
        current = new Date(
          Date.UTC(adjustedYear, adjustedMonth, Math.min(targetDay, daysInNextMonth), h, m, s),
        );
      } else {
        current = getNthWeekdayOfMonth(
          adjustedYear,
          adjustedMonth,
          h,
          m,
          s,
          pat.value as string,
        );
      }
    }
  } else if (frequency === RecurrenceFrequency.YEARLY) {
    const pat = pattern as {
      month: number;
      day?: number;
      relative?: string;
    };
    let current = new Date(startAt);
    while (current <= endDate && dates.length < maxOccurrences) {
      dates.push(new Date(current));
      const nextYear = current.getUTCFullYear() + 1;
      const zeroBasedMonth = (pat.month ?? current.getUTCMonth() + 1) - 1;

      if (pat.relative) {
        current = getNthWeekdayOfMonth(nextYear, zeroBasedMonth, h, m, s, pat.relative);
      } else {
        const day = pat.day ?? current.getUTCDate();
        const daysInMonth = getDaysInMonth(nextYear, zeroBasedMonth);
        current = new Date(
          Date.UTC(nextYear, zeroBasedMonth, Math.min(day, daysInMonth), h, m, s),
        );
      }
    }
  }

  return dates;
}

/** Apply time delta (from editing startAt) and other scalar changes to an instance date. */
function applyTimeDelta(instanceDate: Date, deltaMs: number): Date {
  return new Date(instanceDate.getTime() + deltaMs);
}

@Injectable()
export class RecurringEventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
  ) {}

  async create(dto: CreateRecurringEventDto): Promise<{
    event: Event;
    instancesCreated: number;
    instancesCreatedUntil: Date;
  }> {
    const { recurrenceRule, ...eventFields } = dto;

    // Validate end value
    this.validateRecurrenceRule(recurrenceRule.frequency, recurrenceRule.pattern ?? null, recurrenceRule.endType, recurrenceRule.endValue ?? null);

    const generationUntil = new Date();
    generationUntil.setMonth(
      generationUntil.getMonth() + RECURRENCE_GENERATION_MONTHS,
    );

    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    const duration = endAt ? endAt.getTime() - startAt.getTime() : null;

    // Pre-check: estimate instance count
    const dates = generateOccurrenceDates(
      startAt,
      recurrenceRule.frequency,
      recurrenceRule.pattern ?? null,
      recurrenceRule.endType,
      recurrenceRule.endValue ?? null,
      generationUntil,
    );

    if (dates.length > MAX_RECURRENCE_INSTANCES) {
      throw new BadRequestException(
        `This recurrence rule would generate ${dates.length} instances, which exceeds the maximum of ${MAX_RECURRENCE_INSTANCES}.`,
      );
    }

    if (dates.length === 0) {
      throw new BadRequestException(
        'The recurrence rule produces no instances within the generation window.',
      );
    }

    // Save the template
    const template = this.repo.create({
      title: eventFields.title,
      description: eventFields.description ?? null,
      startAt: startAt,
      endAt: endAt,
      allDay: eventFields.allDay ?? false,
      userId: null,
      reminderMinutesBefore: eventFields.reminderMinutesBefore ?? null,
      tag: eventFields.tag ?? EventTag.PERSONAL,
      isRecurrenceTemplate: true,
      recurrenceFrequency: recurrenceRule.frequency,
      recurrencePattern: recurrenceRule.pattern ?? null,
      recurrenceEndType: recurrenceRule.endType,
      recurrenceEndValue: recurrenceRule.endValue ?? null,
      recurrenceGeneratedUntil: generationUntil,
    });

    const savedTemplate = await this.repo.save(template);

    // Save instances in bulk
    const instances = dates.map((date) =>
      this.repo.create({
        title: eventFields.title,
        description: eventFields.description ?? null,
        startAt: date,
        endAt: duration !== null ? new Date(date.getTime() + duration) : null,
        allDay: eventFields.allDay ?? false,
        userId: null,
        reminderMinutesBefore: eventFields.reminderMinutesBefore ?? null,
        tag: eventFields.tag ?? EventTag.PERSONAL,
        recurringEventId: savedTemplate.id,
        isRecurrenceTemplate: false,
        isRecurrenceOverride: false,
      }),
    );

    await this.repo.save(instances);

    return {
      event: savedTemplate,
      instancesCreated: instances.length,
      instancesCreatedUntil: generationUntil,
    };
  }

  async findAll(
    query: QueryRecurringEventsDto,
  ): Promise<{ data: Event[]; total: number; limit: number; offset: number }> {
    const where: Record<string, unknown> = { isRecurrenceTemplate: true };
    if (query.frequency) {
      where.recurrenceFrequency = query.frequency;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { startAt: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findOne(id: string): Promise<Event & { nextOccurrenceAt: Date | null; totalInstanceCount: number; remainingInstanceCount: number }> {
    const template = await this.repo.findOne({
      where: { id, isRecurrenceTemplate: true },
    });
    if (!template) {
      throw new NotFoundException(`Recurring event series ${id} not found`);
    }

    const now = new Date();
    const totalInstanceCount = await this.repo.count({
      where: { recurringEventId: id },
    });
    const remainingInstanceCount = await this.repo.count({
      where: { recurringEventId: id, startAt: MoreThanOrEqual(now) },
    });

    const nextInstance = await this.repo.findOne({
      where: { recurringEventId: id, startAt: MoreThanOrEqual(now) },
      order: { startAt: 'ASC' },
    });

    return Object.assign(template, {
      nextOccurrenceAt: nextInstance?.startAt ?? null,
      totalInstanceCount,
      remainingInstanceCount,
    });
  }

  async update(
    id: string,
    dto: UpdateRecurringEventDto,
  ): Promise<{ event: Event; updatedInstanceCount: number }> {
    const template = await this.repo.findOne({
      where: { id, isRecurrenceTemplate: true },
    });
    if (!template) {
      throw new NotFoundException(`Recurring event series ${id} not found`);
    }

    const scope = dto.scope ?? UpdateScope.ALL;

    if (scope === UpdateScope.ALL) {
      return this.updateAllInstances(template, dto);
    }

    // this_only and this_and_following on the series level both behave as ALL
    // (series-level update via PATCH /events/recurring/:id always affects all or regenerates)
    return this.updateAllInstances(template, dto);
  }

  private async updateAllInstances(
    template: Event,
    dto: UpdateRecurringEventDto,
  ): Promise<{ event: Event; updatedInstanceCount: number }> {
    const now = new Date();
    const oldStartAt = new Date(template.startAt);

    // Apply scalar updates to template
    const scalarFields = this.extractScalarFields(dto);
    Object.assign(template, scalarFields);

    if (dto.recurrenceRule) {
      this.validateRecurrenceRule(
        dto.recurrenceRule.frequency,
        dto.recurrenceRule.pattern ?? null,
        dto.recurrenceRule.endType,
        dto.recurrenceRule.endValue ?? null,
      );
      template.recurrenceFrequency = dto.recurrenceRule.frequency;
      template.recurrencePattern = dto.recurrenceRule.pattern ?? null;
      template.recurrenceEndType = dto.recurrenceRule.endType;
      template.recurrenceEndValue = dto.recurrenceRule.endValue ?? null;
    }

    await this.repo.save(template);

    // Delete all future instances (past instances left as-is)
    const futureInstances = await this.repo.find({
      where: {
        recurringEventId: template.id,
        startAt: MoreThanOrEqual(now),
        isRecurrenceOverride: false,
      },
    });

    if (futureInstances.length > 0) {
      await this.repo.remove(futureInstances);
    }

    // Regenerate instances from now onward
    const generationUntil = new Date();
    generationUntil.setMonth(
      generationUntil.getMonth() + RECURRENCE_GENERATION_MONTHS,
    );

    const newStartAt = dto.startAt ? new Date(dto.startAt) : new Date(template.startAt);
    const duration = template.endAt
      ? new Date(template.endAt).getTime() - new Date(template.startAt).getTime()
      : null;

    // Generate from now using the current (possibly new) recurrence rule
    // We need to find the first occurrence >= now
    const allDates = generateOccurrenceDates(
      newStartAt,
      template.recurrenceFrequency!,
      template.recurrencePattern,
      template.recurrenceEndType!,
      template.recurrenceEndValue,
      generationUntil,
    );

    const futureDates = allDates.filter((d) => d >= now);

    template.recurrenceGeneratedUntil = generationUntil;
    await this.repo.save(template);

    const newInstances = futureDates.map((date) =>
      this.repo.create({
        title: template.title,
        description: template.description,
        startAt: date,
        endAt: duration !== null ? new Date(date.getTime() + duration) : null,
        allDay: template.allDay,
        userId: template.userId,
        reminderMinutesBefore: template.reminderMinutesBefore,
        tag: template.tag,
        recurringEventId: template.id,
        isRecurrenceTemplate: false,
        isRecurrenceOverride: false,
      }),
    );

    if (newInstances.length > 0) {
      await this.repo.save(newInstances);
    }

    return { event: template, updatedInstanceCount: newInstances.length };
  }

  async remove(id: string): Promise<void> {
    const template = await this.repo.findOne({
      where: { id, isRecurrenceTemplate: true },
    });
    if (!template) {
      throw new NotFoundException(`Recurring event series ${id} not found`);
    }
    // CASCADE on FK will delete all instances when template is removed
    await this.repo.remove(template);
  }

  async findInstances(
    id: string,
    query: QueryRecurringInstancesDto,
  ): Promise<{ data: Event[]; total: number; limit: number; offset: number }> {
    const exists = await this.repo.exists({ where: { id, isRecurrenceTemplate: true } });
    if (!exists) {
      throw new NotFoundException(`Recurring event series ${id} not found`);
    }

    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.recurringEventId = :id', { id })
      .orderBy('e.startAt', 'ASC');

    if (query.fromDate) {
      qb.andWhere('e.startAt >= :fromDate', { fromDate: new Date(query.fromDate) });
    }
    if (query.toDate) {
      qb.andWhere('e.startAt <= :toDate', { toDate: new Date(query.toDate) });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip(query.offset)
      .take(query.limit)
      .getMany();

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  /**
   * Update a single recurring instance with scope awareness.
   * Called from EventsController for PATCH /events/:id
   */
  async updateInstance(
    instance: Event,
    dto: Partial<{
      title: string;
      description: string | null;
      startAt: string;
      endAt: string | null;
      allDay: boolean;
      reminderMinutesBefore: number | null;
      tag: EventTag;
      isCompleted: boolean;
    }>,
    scope: UpdateScope,
  ): Promise<{ event: Event; affectedInstanceCount: number }> {
    if (scope === UpdateScope.THIS_ONLY) {
      Object.assign(instance, dto);
      instance.isRecurrenceOverride = true;
      instance.overriddenAt = new Date();
      const saved = await this.repo.save(instance);
      return { event: saved, affectedInstanceCount: 1 };
    }

    if (scope === UpdateScope.THIS_AND_FOLLOWING) {
      return this.updateInstanceAndFollowing(instance, dto);
    }

    // scope === ALL: update all future instances of the series
    return this.updateAllInstancesFromInstance(instance, dto);
  }

  private async updateInstanceAndFollowing(
    instance: Event,
    dto: Record<string, unknown>,
  ): Promise<{ event: Event; affectedInstanceCount: number }> {
    const instanceStartAt = new Date(instance.startAt);
    const startTimeDelta =
      dto.startAt ? new Date(dto.startAt as string).getTime() - instanceStartAt.getTime() : 0;

    const futureInstances = await this.repo.find({
      where: {
        recurringEventId: instance.recurringEventId!,
        startAt: MoreThanOrEqual(instanceStartAt),
        isRecurrenceOverride: false,
      },
      order: { startAt: 'ASC' },
    });

    const { startAt: _startAt, endAt: _endAt, ...scalarDto } = dto as Record<string, unknown>;

    for (const inst of futureInstances) {
      Object.assign(inst, scalarDto);
      if (startTimeDelta !== 0) {
        inst.startAt = applyTimeDelta(new Date(inst.startAt), startTimeDelta);
        if (inst.endAt) {
          inst.endAt = applyTimeDelta(new Date(inst.endAt), startTimeDelta);
        }
      }
    }

    await this.repo.save(futureInstances);

    const saved = futureInstances.find((i) => i.id === instance.id) ?? futureInstances[0];
    return { event: saved, affectedInstanceCount: futureInstances.length };
  }

  private async updateAllInstancesFromInstance(
    instance: Event,
    dto: Record<string, unknown>,
  ): Promise<{ event: Event; affectedInstanceCount: number }> {
    const instanceStartAt = new Date(instance.startAt);
    const startTimeDelta =
      dto.startAt ? new Date(dto.startAt as string).getTime() - instanceStartAt.getTime() : 0;

    const allInstances = await this.repo.find({
      where: {
        recurringEventId: instance.recurringEventId!,
        isRecurrenceOverride: false,
      },
      order: { startAt: 'ASC' },
    });

    const { startAt: _startAt, endAt: _endAt, ...scalarDto } = dto as Record<string, unknown>;

    for (const inst of allInstances) {
      Object.assign(inst, scalarDto);
      if (startTimeDelta !== 0) {
        inst.startAt = applyTimeDelta(new Date(inst.startAt), startTimeDelta);
        if (inst.endAt) {
          inst.endAt = applyTimeDelta(new Date(inst.endAt), startTimeDelta);
        }
      }
    }

    await this.repo.save(allInstances);

    const saved = allInstances.find((i) => i.id === instance.id) ?? allInstances[0];
    return { event: saved, affectedInstanceCount: allInstances.length };
  }

  /**
   * Delete a recurring instance with scope awareness.
   * Called from EventsController for DELETE /events/:id
   */
  async deleteInstance(instance: Event, scope: UpdateScope): Promise<{ deletedCount: number }> {
    if (scope === UpdateScope.THIS_ONLY) {
      await this.repo.remove(instance);
      return { deletedCount: 1 };
    }

    if (scope === UpdateScope.THIS_AND_FOLLOWING) {
      const futureInstances = await this.repo.find({
        where: {
          recurringEventId: instance.recurringEventId!,
          startAt: MoreThanOrEqual(new Date(instance.startAt)),
        },
      });
      await this.repo.remove(futureInstances);
      return { deletedCount: futureInstances.length };
    }

    // scope === ALL: delete the template (cascades to all instances)
    const template = await this.repo.findOneBy({ id: instance.recurringEventId! });
    if (template) {
      await this.repo.remove(template);
    }
    return { deletedCount: -1 }; // all deleted via cascade
  }

  private validateRecurrenceRule(
    frequency: RecurrenceFrequency,
    pattern: Record<string, unknown> | null,
    endType: RecurrenceEndType,
    endValue: string | null,
  ): void {
    if (frequency === RecurrenceFrequency.WEEKLY) {
      const days = pattern?.days as string[] | undefined;
      if (!days || days.length === 0) {
        throw new BadRequestException(
          'Weekly recurrence requires at least one day in pattern.days',
        );
      }
    }

    if (
      frequency === RecurrenceFrequency.MONTHLY &&
      (!pattern?.type || pattern.value === undefined)
    ) {
      throw new BadRequestException(
        'Monthly recurrence requires pattern.type ("date" or "relative") and pattern.value',
      );
    }

    if (frequency === RecurrenceFrequency.YEARLY && !pattern?.month) {
      throw new BadRequestException(
        'Yearly recurrence requires pattern.month',
      );
    }

    if (endType === RecurrenceEndType.AFTER_OCCURRENCES) {
      const n = parseInt(endValue ?? '', 10);
      if (isNaN(n) || n <= 0) {
        throw new BadRequestException(
          'endValue must be a positive integer when endType is "after_occurrences"',
        );
      }
    }

    if (endType === RecurrenceEndType.ON_DATE) {
      if (!endValue || isNaN(Date.parse(endValue))) {
        throw new BadRequestException(
          'endValue must be a valid ISO 8601 date when endType is "on_date"',
        );
      }
    }
  }

  private extractScalarFields(dto: UpdateRecurringEventDto): Partial<Event> {
    const fields: Partial<Event> = {};
    if (dto.title !== undefined) fields.title = dto.title;
    if (dto.description !== undefined) fields.description = dto.description ?? null;
    if (dto.allDay !== undefined) fields.allDay = dto.allDay;
    if (dto.reminderMinutesBefore !== undefined)
      fields.reminderMinutesBefore = dto.reminderMinutesBefore ?? null;
    if (dto.tag !== undefined) fields.tag = dto.tag;
    return fields;
  }
}
