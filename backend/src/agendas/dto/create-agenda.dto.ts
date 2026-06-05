import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgendaDto {
  @ApiProperty({ description: 'Agenda title', maxLength: 255, example: 'Q2 Planning' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Optional agenda description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Agenda start date/time (ISO 8601, UTC)',
    example: '2026-06-15T09:00:00Z',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: 'Agenda end date/time (ISO 8601, UTC)',
    example: '2026-06-15T17:00:00Z',
  })
  @IsDateString()
  endAt: string;
}
