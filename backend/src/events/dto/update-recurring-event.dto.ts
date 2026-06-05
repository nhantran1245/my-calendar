import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
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
import { UpdateScope } from '../enums/update-scope.enum';
import { RecurrenceRuleDto } from './recurrence-rule.dto';

export class UpdateRecurringEventDto {
  @ApiPropertyOptional({ description: 'Event title', maxLength: MAX_TITLE_LENGTH })
  @IsString()
  @IsOptional()
  @MaxLength(MAX_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ description: 'Event description', nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ description: 'New start time for affected instances (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({ description: 'New end time for affected instances (ISO 8601)', nullable: true })
  @IsDateString()
  @IsOptional()
  endAt?: string | null;

  @ApiPropertyOptional({ description: 'Whether event spans full day(s)' })
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

  @ApiPropertyOptional({ enum: EventTag })
  @IsEnum(EventTag)
  @IsOptional()
  tag?: EventTag;

  @ApiPropertyOptional({ description: 'Updated recurrence rule (replaces existing rule)' })
  @ValidateNested()
  @Type(() => RecurrenceRuleDto)
  @IsOptional()
  recurrenceRule?: RecurrenceRuleDto;

  @ApiPropertyOptional({
    enum: UpdateScope,
    default: UpdateScope.ALL,
    description: 'Which instances to update',
  })
  @IsEnum(UpdateScope)
  @IsOptional()
  scope?: UpdateScope;
}
