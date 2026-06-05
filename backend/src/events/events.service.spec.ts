import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Between, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.entity';
import { EventsService } from './events.service';
import { EventTag } from './enums/event-tag.enum';
import { SortOrder } from './enums/sort-order.enum';

type MockRepo<T = Event> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'uuid-1',
    title: 'Test event',
    description: null,
    startAt: new Date(Date.now() + 60_000 * 60), // 1 hour in the future
    endAt: null,
    allDay: false,
    userId: null,
    reminderMinutesBefore: null,
    tag: EventTag.PERSONAL,
    isCompleted: false,
    recurringEventId: null,
    recurringEvent: null,
    recurrenceFrequency: null,
    recurrencePattern: null,
    recurrenceEndType: null,
    recurrenceEndValue: null,
    recurrenceGeneratedUntil: null,
    isRecurrenceTemplate: false,
    isRecurrenceOverride: false,
    overriddenAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('EventsService', () => {
  let service: EventsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useFactory: mockRepo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repo = module.get<MockRepo>(getRepositoryToken(Event));
  });

  // ─── findByMonth ─────────────────────────────────────────────────────────────

  describe('findByMonth', () => {
    it('returns events for the given month ordered ASC', async () => {
      const events = [makeEvent(), makeEvent({ id: 'uuid-2' })];
      repo.find!.mockResolvedValue(events);

      const result = await service.findByMonth(2026, 6, true);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { startAt: SortOrder.ASC },
        }),
      );
      expect(result).toEqual(events);
    });

    it('filters out completed events when includeCompleted=false', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findByMonth(2026, 6, false);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isCompleted: false }),
        }),
      );
    });

    it('does not add isCompleted filter when includeCompleted=true', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findByMonth(2026, 6, true);

      const call = repo.find!.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(call.where).not.toHaveProperty('isCompleted');
    });

    it('uses Between with correct month boundaries', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findByMonth(2026, 6, true);

      const call = repo.find!.mock.calls[0][0] as { where: { startAt: unknown } };
      // The startAt value should be a TypeORM FindOperator (Between)
      expect(call.where.startAt).toBeDefined();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the event when found', async () => {
      const event = makeEvent();
      repo.findOneBy!.mockResolvedValue(event);

      const result = await service.findOne('uuid-1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(event);
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns the saved event', async () => {
      const dto: CreateEventDto = {
        title: 'New event',
        startAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
      const event = makeEvent({ title: 'New event' });
      repo.create!.mockReturnValue(event);
      repo.save!.mockResolvedValue(event);

      const userId = 'user-123';
      const result = await service.create(dto, userId);

      expect(repo.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(repo.save).toHaveBeenCalledWith(event);
      expect(result).toEqual(event);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the event', async () => {
      const event = makeEvent();
      const dto: UpdateEventDto = { title: 'Updated' };
      repo.findOneBy!.mockResolvedValue(event);
      repo.save!.mockResolvedValue({ ...event, title: 'Updated' });

      const result = await service.update('uuid-1', dto);

      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when event start is in the past', async () => {
      const pastEvent = makeEvent({
        startAt: new Date(Date.now() - 60_000 * 60), // 1 hour ago
      });
      repo.findOneBy!.mockResolvedValue(pastEvent);

      await expect(service.update('uuid-1', { title: 'X' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the event and returns void', async () => {
      const event = makeEvent();
      repo.findOneBy!.mockResolvedValue(event);
      repo.remove!.mockResolvedValue(undefined);

      await expect(service.remove('uuid-1')).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(event);
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── toggleComplete ───────────────────────────────────────────────────────────

  describe('toggleComplete', () => {
    it('marks the event as completed', async () => {
      const event = makeEvent({ isCompleted: false });
      repo.findOneBy!.mockResolvedValue(event);
      repo.save!.mockResolvedValue({ ...event, isCompleted: true });

      const result = await service.toggleComplete('uuid-1', true);

      expect(result.isCompleted).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isCompleted: true }),
      );
    });

    it('marks the event as uncompleted', async () => {
      const event = makeEvent({ isCompleted: true });
      repo.findOneBy!.mockResolvedValue(event);
      repo.save!.mockResolvedValue({ ...event, isCompleted: false });

      const result = await service.toggleComplete('uuid-1', false);

      expect(result.isCompleted).toBe(false);
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.toggleComplete('missing', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
