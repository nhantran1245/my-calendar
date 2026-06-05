import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Event } from '../events/event.entity';
import { AgendasService } from './agendas.service';
import { CreateAgendaEventDto } from './dto/create-agenda-event.dto';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { ListAgendaEventsDto } from './dto/list-agenda-events.dto';
import { ListAgendasDto } from './dto/list-agendas.dto';
import { UpdateAgendaEventDto } from './dto/update-agenda-event.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { AgendaEvent } from './entities/agenda-event.entity';
import { Agenda } from './entities/agenda.entity';
import { AgendaEventStatus } from './enums/agenda-event-status.enum';
import { AgendaStatus } from './enums/agenda-status.enum';
import { PaginationDirection } from './enums/pagination-direction.enum';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const buildQbMock = (overrides: Partial<{
  getCount: () => Promise<number>;
  getMany: () => Promise<unknown[]>;
}> = {}) => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(overrides.getCount ? 0 : 0),
    getMany: jest.fn().mockResolvedValue([]),
  } as unknown as SelectQueryBuilder<Agenda | AgendaEvent>;

  if (overrides.getCount) {
    (qb.getCount as jest.Mock).mockImplementation(overrides.getCount);
  }
  if (overrides.getMany) {
    (qb.getMany as jest.Mock).mockImplementation(overrides.getMany);
  }

  return qb;
};

describe('AgendasService', () => {
  let service: AgendasService;
  let agendaRepo: MockRepository<Agenda>;
  let agendaEventRepo: MockRepository<AgendaEvent>;
  let eventRepo: MockRepository<Event>;

  const mockAgenda: Agenda = {
    id: 'agenda-uuid-1',
    title: 'Test Agenda',
    description: null,
    startAt: new Date('2026-07-01T09:00:00Z'),
    endAt: new Date('2026-07-01T17:00:00Z'),
    status: AgendaStatus.ACTIVE,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    agendaEvents: [],
  };

  const mockAgendaEvent: AgendaEvent = {
    id: 'event-uuid-1',
    agendaId: 'agenda-uuid-1',
    title: 'Test Event',
    description: null,
    startAt: new Date('2026-07-01T10:00:00Z'),
    endAt: new Date('2026-07-01T11:00:00Z'),
    status: AgendaEventStatus.ACTIVE,
    sortOrder: 0,
    sourceEventId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    agenda: mockAgenda,
    sourceEvent: null,
  };

  beforeEach(async () => {
    agendaRepo = createMockRepository<Agenda>();
    agendaEventRepo = createMockRepository<AgendaEvent>();
    eventRepo = createMockRepository<Event>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendasService,
        { provide: getRepositoryToken(Agenda), useValue: agendaRepo },
        { provide: getRepositoryToken(AgendaEvent), useValue: agendaEventRepo },
        { provide: getRepositoryToken(Event), useValue: eventRepo },
      ],
    }).compile();

    service = module.get<AgendasService>(AgendasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== findAll ====================

  describe('findAll', () => {
    it('returns paginated agendas (forward direction)', async () => {
      const qb = buildQbMock({
        getCount: async () => 1,
        getMany: async () => [mockAgenda],
      });
      agendaRepo.createQueryBuilder!.mockReturnValue(qb);

      const query: ListAgendasDto = { direction: PaginationDirection.FORWARD };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasMore).toBe(false);
    });

    it('returns paginated agendas (backward direction)', async () => {
      const qb = buildQbMock({
        getCount: async () => 5,
        getMany: async () => [mockAgenda],
      });
      agendaRepo.createQueryBuilder!.mockReturnValue(qb);

      const query: ListAgendasDto = {
        direction: PaginationDirection.BACKWARD,
        limit: 1,
        offset: 0,
      };
      const result = await service.findAll(query);

      expect(result.meta.total).toBe(5);
      expect(result.meta.hasMore).toBe(true);
    });

    it('filters by status when provided', async () => {
      const qb = buildQbMock();
      agendaRepo.createQueryBuilder!.mockReturnValue(qb);

      const query: ListAgendasDto = { status: AgendaStatus.COMPLETED };
      await service.findAll(query);

      expect(qb.andWhere).toHaveBeenCalledWith('agenda.status = :status', {
        status: AgendaStatus.COMPLETED,
      });
    });
  });

  // ==================== findOne ====================

  describe('findOne', () => {
    it('returns the agenda when found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      const result = await service.findOne('agenda-uuid-1');
      expect(result).toEqual(mockAgenda);
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== create ====================

  describe('create', () => {
    it('creates and returns a new agenda', async () => {
      agendaRepo.create!.mockReturnValue(mockAgenda);
      agendaRepo.save!.mockResolvedValue(mockAgenda);

      const dto: CreateAgendaDto = {
        title: 'Test Agenda',
        startAt: '2026-07-01T09:00:00Z',
        endAt: '2026-07-01T17:00:00Z',
      };
      const result = await service.create(dto);
      expect(result).toEqual(mockAgenda);
      expect(agendaRepo.create).toHaveBeenCalled();
      expect(agendaRepo.save).toHaveBeenCalled();
    });
  });

  // ==================== update ====================

  describe('update', () => {
    it('updates and returns the agenda', async () => {
      agendaRepo.findOne!.mockResolvedValue({ ...mockAgenda });
      const updatedAgenda = { ...mockAgenda, title: 'Updated Title' };
      agendaRepo.save!.mockResolvedValue(updatedAgenda);

      const dto: UpdateAgendaDto = { title: 'Updated Title' };
      const result = await service.update('agenda-uuid-1', dto);
      expect(result.title).toBe('Updated Title');
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);
      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== remove ====================

  describe('remove', () => {
    it('soft-deletes the agenda by setting deletedAt', async () => {
      const agenda = { ...mockAgenda, deletedAt: null };
      agendaRepo.findOne!.mockResolvedValue(agenda);
      agendaRepo.save!.mockResolvedValue({ ...agenda, deletedAt: new Date() });

      await service.remove('agenda-uuid-1');
      expect(agendaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findAllEvents ====================

  describe('findAllEvents', () => {
    it('returns paginated agenda events', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);

      const qb = buildQbMock({
        getCount: async () => 1,
        getMany: async () => [mockAgendaEvent],
      });
      agendaEventRepo.createQueryBuilder!.mockReturnValue(qb);

      const query: ListAgendaEventsDto = { direction: PaginationDirection.FORWARD };
      const result = await service.findAllEvents('agenda-uuid-1', query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);
      await expect(
        service.findAllEvents('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findOneEvent ====================

  describe('findOneEvent', () => {
    it('returns the agenda event when found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue(mockAgendaEvent);

      const result = await service.findOneEvent('agenda-uuid-1', 'event-uuid-1');
      expect(result).toEqual(mockAgendaEvent);
    });

    it('throws NotFoundException when event not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.findOneEvent('agenda-uuid-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);
      await expect(
        service.findOneEvent('nonexistent', 'event-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== createEvent ====================

  describe('createEvent', () => {
    it('creates and returns a new agenda event', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.create!.mockReturnValue(mockAgendaEvent);
      agendaEventRepo.save!.mockResolvedValue(mockAgendaEvent);

      const dto: CreateAgendaEventDto = {
        title: 'Test Event',
        startAt: '2026-07-01T10:00:00Z',
        endAt: '2026-07-01T11:00:00Z',
      };
      const result = await service.createEvent('agenda-uuid-1', dto);
      expect(result).toEqual(mockAgendaEvent);
    });

    it('validates sourceEventId if provided and throws if not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      eventRepo.findOneBy!.mockResolvedValue(null);

      const dto: CreateAgendaEventDto = {
        title: 'Test Event',
        startAt: '2026-07-01T10:00:00Z',
        endAt: '2026-07-01T11:00:00Z',
        sourceEventId: 'nonexistent-event',
      };
      await expect(service.createEvent('agenda-uuid-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates agenda event with sourceEventId when source event exists', async () => {
      const sourceEvent = { id: 'source-event-uuid' } as Event;
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      eventRepo.findOneBy!.mockResolvedValue(sourceEvent);
      const agendaEventWithSource = { ...mockAgendaEvent, sourceEventId: 'source-event-uuid' };
      agendaEventRepo.create!.mockReturnValue(agendaEventWithSource);
      agendaEventRepo.save!.mockResolvedValue(agendaEventWithSource);

      const dto: CreateAgendaEventDto = {
        title: 'Test Event',
        startAt: '2026-07-01T10:00:00Z',
        endAt: '2026-07-01T11:00:00Z',
        sourceEventId: 'source-event-uuid',
      };
      const result = await service.createEvent('agenda-uuid-1', dto);
      expect(result.sourceEventId).toBe('source-event-uuid');
    });

    it('throws NotFoundException when agenda not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(null);

      const dto: CreateAgendaEventDto = {
        title: 'Test Event',
        startAt: '2026-07-01T10:00:00Z',
        endAt: '2026-07-01T11:00:00Z',
      };
      await expect(service.createEvent('nonexistent', dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateEvent ====================

  describe('updateEvent', () => {
    it('updates and returns the agenda event', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue({ ...mockAgendaEvent });
      const updatedEvent = { ...mockAgendaEvent, title: 'Updated Event' };
      agendaEventRepo.save!.mockResolvedValue(updatedEvent);

      const dto: UpdateAgendaEventDto = { title: 'Updated Event' };
      const result = await service.updateEvent('agenda-uuid-1', 'event-uuid-1', dto);
      expect(result.title).toBe('Updated Event');
    });

    it('updates status of agenda event', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue({ ...mockAgendaEvent });
      const updatedEvent = { ...mockAgendaEvent, status: AgendaEventStatus.COMPLETED };
      agendaEventRepo.save!.mockResolvedValue(updatedEvent);

      const dto: UpdateAgendaEventDto = { status: AgendaEventStatus.COMPLETED };
      const result = await service.updateEvent('agenda-uuid-1', 'event-uuid-1', dto);
      expect(result.status).toBe(AgendaEventStatus.COMPLETED);
    });

    it('throws NotFoundException when event not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.updateEvent('agenda-uuid-1', 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== removeEvent ====================

  describe('removeEvent', () => {
    it('hard-deletes the agenda event', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue(mockAgendaEvent);
      agendaEventRepo.delete!.mockResolvedValue({ affected: 1 });

      await service.removeEvent('agenda-uuid-1', 'event-uuid-1');
      expect(agendaEventRepo.delete).toHaveBeenCalledWith('event-uuid-1');
    });

    it('throws NotFoundException when event not found', async () => {
      agendaRepo.findOne!.mockResolvedValue(mockAgenda);
      agendaEventRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.removeEvent('agenda-uuid-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
