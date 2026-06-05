import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RecurrenceEndType } from '../enums/recurrence-end-type.enum';
import { RecurrenceFrequency } from '../enums/recurrence-frequency.enum';

export class RecurrenceRuleDto {
  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({
    description:
      'Pattern details. Weekly: {days: ["mon","wed"]}. Monthly date: {type:"date",value:15}. Monthly relative: {type:"relative",value:"2nd_tuesday"}. Yearly: {month:8,day:15} or {month:8,relative:"2nd_tuesday"}. Omit for daily.',
  })
  @IsObject()
  @IsOptional()
  pattern?: Record<string, unknown>;

  @ApiProperty({ enum: RecurrenceEndType })
  @IsEnum(RecurrenceEndType)
  endType: RecurrenceEndType;

  @ApiPropertyOptional({
    description:
      'End value. Null for "never". Integer (occurrences) for "after_occurrences". ISO date string for "on_date".',
  })
  @IsOptional()
  @IsString()
  endValue?: string;
}
