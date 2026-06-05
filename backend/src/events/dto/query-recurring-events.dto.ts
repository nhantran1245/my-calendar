import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RecurrenceFrequency } from '../enums/recurrence-frequency.enum';

export class QueryRecurringEventsDto {
  @ApiPropertyOptional({ type: Number, default: 50 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiPropertyOptional({ enum: RecurrenceFrequency, description: 'Filter by frequency' })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  frequency?: RecurrenceFrequency;
}
