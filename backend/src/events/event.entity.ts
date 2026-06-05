import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventTag } from './enums/event-tag.enum';
import { RecurrenceEndType } from './enums/recurrence-end-type.enum';
import { RecurrenceFrequency } from './enums/recurrence-frequency.enum';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ name: 'all_day', default: false })
  allDay: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, default: null })
  userId: string | null;

  @Column({ name: 'reminder_minutes_before', nullable: true, type: 'int' })
  reminderMinutesBefore: number | null;

  @Column({ type: 'enum', enum: EventTag, default: EventTag.PERSONAL })
  tag: EventTag;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  // ===== Recurring Event Fields =====

  @Column({ name: 'recurring_event_id', type: 'uuid', nullable: true })
  recurringEventId: string | null;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurring_event_id' })
  recurringEvent: Event | null;

  @Column({
    name: 'recurrence_frequency',
    type: 'enum',
    enum: RecurrenceFrequency,
    nullable: true,
  })
  recurrenceFrequency: RecurrenceFrequency | null;

  @Column({ name: 'recurrence_pattern', type: 'jsonb', nullable: true })
  recurrencePattern: Record<string, unknown> | null;

  @Column({
    name: 'recurrence_end_type',
    type: 'enum',
    enum: RecurrenceEndType,
    nullable: true,
  })
  recurrenceEndType: RecurrenceEndType | null;

  @Column({ name: 'recurrence_end_value', type: 'text', nullable: true })
  recurrenceEndValue: string | null;

  @Column({
    name: 'recurrence_generated_until',
    type: 'timestamptz',
    nullable: true,
  })
  recurrenceGeneratedUntil: Date | null;

  @Column({ name: 'is_recurrence_template', default: false })
  isRecurrenceTemplate: boolean;

  @Column({ name: 'is_recurrence_override', default: false })
  isRecurrenceOverride: boolean;

  @Column({ name: 'overridden_at', type: 'timestamptz', nullable: true })
  overriddenAt: Date | null;

  // ===== End Recurring Event Fields =====

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
