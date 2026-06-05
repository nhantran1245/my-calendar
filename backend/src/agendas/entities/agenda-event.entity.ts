import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/event.entity';
import { AgendaEventStatus } from '../enums/agenda-event-status.enum';
import { Agenda } from './agenda.entity';

@Entity('agenda_events')
export class AgendaEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agenda_id', type: 'uuid' })
  agendaId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: AgendaEventStatus.ACTIVE,
  })
  status: AgendaEventStatus;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'source_event_id', type: 'uuid', nullable: true })
  sourceEventId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Agenda, (agenda) => agenda.agendaEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agenda_id' })
  agenda: Agenda;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_event_id' })
  sourceEvent: Event | null;
}
