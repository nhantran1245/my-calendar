import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AGENDA_DEFAULT_PAGE_SIZE, AGENDA_MAX_PAGE_SIZE } from '../constants';
import { AgendaStatus } from '../enums/agenda-status.enum';
import { PaginationDirection } from '../enums/pagination-direction.enum';

export class ListAgendasDto {
  @ApiPropertyOptional({
    description: 'Number of agendas per page',
    default: AGENDA_DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: AGENDA_MAX_PAGE_SIZE,
    example: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(AGENDA_MAX_PAGE_SIZE)
  limit?: number = AGENDA_DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Number of agendas to skip',
    default: 0,
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Pagination direction (forward=future, backward=past)',
    enum: PaginationDirection,
    default: PaginationDirection.FORWARD,
    example: PaginationDirection.FORWARD,
  })
  @IsOptional()
  @IsEnum(PaginationDirection)
  direction?: PaginationDirection = PaginationDirection.FORWARD;

  @ApiPropertyOptional({
    description: 'Filter by agenda status',
    enum: AgendaStatus,
    example: AgendaStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AgendaStatus)
  status?: AgendaStatus;
}
