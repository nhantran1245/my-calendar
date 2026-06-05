import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAgendaEventDto {
  @ApiProperty({ description: 'Event title', maxLength: 255, example: 'Team standup' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Optional event description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event start date/time (ISO 8601, UTC)',
    example: '2026-06-15T09:00:00Z',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: 'Event end date/time (ISO 8601, UTC)',
    example: '2026-06-15T09:30:00Z',
  })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: 'Manual sort order within agenda (default 0)',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Optional source calendar event ID to copy from',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  sourceEventId?: string;
}
