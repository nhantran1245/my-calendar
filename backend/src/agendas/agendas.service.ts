import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Event } from '../events/event.entity';
import { AGENDA_DEFAULT_PAGE_SIZE } from './constants';
import { CreateAgendaEventDto } from './dto/create-agenda-event.dto';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { ListAgendaEventsDto } from './dto/list-agenda-events.dto';
import { ListAgendasDto } from './dto/list-agendas.dto';
import { UpdateAgendaEventDto } from './dto/update-agenda-event.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { AgendaEvent } from './entities/agenda-event.entity';
import { Agenda } from './entities/agenda.entity';
import { PaginationDirection } from './enums/pagination-direction.enum';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class AgendasService {
  constructor(
    @InjectRepository(Agenda)
    private readonly agendaRepo: Repository<Agenda>,

    @InjectRepository(AgendaEvent)
    private readonly agendaEventRepo: Repository<AgendaEvent>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async findAll(query: ListAgendasDto): Promise<PaginatedResult<Agenda>> {
    const limit = query.limit ?? AGENDA_DEFAULT_PAGE_SIZE;
    const offset = query.offset ?? 0;
    const direction = query.direction ?? PaginationDirection.FORWARD;
    const now = new Date();

    const qb = this.agendaRepo
      .createQueryBuilder('agenda')
      .where('agenda.deletedAt IS NULL');

    if (direction === PaginationDirection.FORWARD) {
      qb.andWhere('agenda.startAt >= :now', { now });
      qb.orderBy('agenda.startAt', 'ASC').addOrderBy('agenda.id', 'ASC');
    } else {
      qb.andWhere('agenda.startAt < :now', { now });
      qb.orderBy('agenda.startAt', 'DESC').addOrderBy('agenda.id', 'DESC');
    }

    if (query.status) {
      qb.andWhere('agenda.status = :status', { status: query.status });
    }

    const total = await qb.getCount();
    const data = await qb.skip(offset).take(limit).getMany();

    return {
      data,
      meta: {
        limit,
        offset,
        total,
        hasMore: offset + data.length < total,
      },
    };
  }

  async findOne(id: string): Promise<Agenda> {
    const agenda = await this.agendaRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!agenda) {
      throw new NotFoundException(`Agenda ${id} not found`);
    }
    return agenda;
  }

  async create(dto: CreateAgendaDto): Promise<Agenda> {
    const agenda = this.agendaRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
    });
    return this.agendaRepo.save(agenda);
  }

  async update(id: string, dto: UpdateAgendaDto): Promise<Agenda> {
    const agenda = await this.findOne(id);
    if (dto.title !== undefined) agenda.title = dto.title;
    if (dto.description !== undefined) agenda.description = dto.description ?? null;
    if (dto.startAt !== undefined) agenda.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) agenda.endAt = new Date(dto.endAt);
    if (dto.status !== undefined) agenda.status = dto.status;
    return this.agendaRepo.save(agenda);
  }

  async remove(id: string): Promise<void> {
    const agenda = await this.findOne(id);
    agenda.deletedAt = new Date();
    await this.agendaRepo.save(agenda);
  }

  async findAllEvents(
    agendaId: string,
    query: ListAgendaEventsDto,
  ): Promise<PaginatedResult<AgendaEvent>> {
    await this.findOne(agendaId);

    const limit = query.limit ?? AGENDA_DEFAULT_PAGE_SIZE;
    const offset = query.offset ?? 0;
    const direction = query.direction ?? PaginationDirection.FORWARD;
    const now = new Date();

    const qb = this.agendaEventRepo
      .createQueryBuilder('ae')
      .where('ae.agendaId = :agendaId', { agendaId });

    if (direction === PaginationDirection.FORWARD) {
      qb.andWhere('ae.startAt >= :now', { now });
      qb.orderBy('ae.startAt', 'ASC').addOrderBy('ae.id', 'ASC');
    } else {
      qb.andWhere('ae.startAt < :now', { now });
      qb.orderBy('ae.startAt', 'DESC').addOrderBy('ae.id', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb.skip(offset).take(limit).getMany();

    return {
      data,
      meta: {
        limit,
        offset,
        total,
        hasMore: offset + data.length < total,
      },
    };
  }

  async findOneEvent(agendaId: string, eventId: string): Promise<AgendaEvent> {
    await this.findOne(agendaId);
    const agendaEvent = await this.agendaEventRepo.findOne({
      where: { id: eventId, agendaId },
    });
    if (!agendaEvent) {
      throw new NotFoundException(`Agenda event ${eventId} not found in agenda ${agendaId}`);
    }
    return agendaEvent;
  }

  async createEvent(
    agendaId: string,
    dto: CreateAgendaEventDto,
  ): Promise<AgendaEvent> {
    await this.findOne(agendaId);

    if (dto.sourceEventId) {
      const sourceEvent = await this.eventRepo.findOneBy({ id: dto.sourceEventId });
      if (!sourceEvent) {
        throw new NotFoundException(`Source event ${dto.sourceEventId} not found`);
      }
    }

    const agendaEvent = this.agendaEventRepo.create({
      agendaId,
      title: dto.title,
      description: dto.description ?? null,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      sortOrder: dto.sortOrder ?? 0,
      sourceEventId: dto.sourceEventId ?? null,
    });
    return this.agendaEventRepo.save(agendaEvent);
  }

  async updateEvent(
    agendaId: string,
    eventId: string,
    dto: UpdateAgendaEventDto,
  ): Promise<AgendaEvent> {
    const agendaEvent = await this.findOneEvent(agendaId, eventId);
    if (dto.title !== undefined) agendaEvent.title = dto.title;
    if (dto.description !== undefined) agendaEvent.description = dto.description ?? null;
    if (dto.startAt !== undefined) agendaEvent.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) agendaEvent.endAt = new Date(dto.endAt);
    if (dto.sortOrder !== undefined) agendaEvent.sortOrder = dto.sortOrder;
    if (dto.status !== undefined) agendaEvent.status = dto.status;
    if (dto.sourceEventId !== undefined)
      agendaEvent.sourceEventId = dto.sourceEventId ?? null;
    return this.agendaEventRepo.save(agendaEvent);
  }

  async removeEvent(agendaId: string, eventId: string): Promise<void> {
    const agendaEvent = await this.findOneEvent(agendaId, eventId);
    await this.agendaEventRepo.delete(agendaEvent.id);
  }
}
