import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MAX_REMINDER_MINUTES,
  MAX_TITLE_LENGTH,
  MIN_REMINDER_MINUTES,
} from '../../constants';
import { EventTag } from '../enums/event-tag.enum';
import { RecurrenceRuleDto } from './recurrence-rule.dto';

export class CreateRecurringEventDto {
  @ApiProperty({ description: 'Event title', maxLength: MAX_TITLE_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TITLE_LENGTH)
  title: string;

  @ApiPropertyOptional({ description: 'Event description', nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'First occurrence start time (ISO 8601)',
    example: '2026-06-09T19:00:00Z',
  })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({
    description: 'First occurrence end time (ISO 8601)',
    nullable: true,
    example: '2026-06-09T20:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  endAt?: string | null;

  @ApiPropertyOptional({ description: 'Whether event spans full day(s)', default: false })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiPropertyOptional({
    description: `Minutes before event to trigger reminder (${MIN_REMINDER_MINUTES}–${MAX_REMINDER_MINUTES})`,
    minimum: MIN_REMINDER_MINUTES,
    maximum: MAX_REMINDER_MINUTES,
    nullable: true,
  })
  @IsInt()
  @Min(MIN_REMINDER_MINUTES)
  @Max(MAX_REMINDER_MINUTES)
  @IsOptional()
  reminderMinutesBefore?: number | null;

  @ApiPropertyOptional({ enum: EventTag, default: EventTag.PERSONAL })
  @IsEnum(EventTag)
  @IsOptional()
  tag?: EventTag;

  @ApiProperty({ description: 'Recurrence rule for the series' })
  @ValidateNested()
  @Type(() => RecurrenceRuleDto)
  recurrenceRule: RecurrenceRuleDto;
}
