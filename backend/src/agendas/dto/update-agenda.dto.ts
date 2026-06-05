import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AgendaStatus } from '../enums/agenda-status.enum';
import { CreateAgendaDto } from './create-agenda.dto';

export class UpdateAgendaDto extends PartialType(CreateAgendaDto) {
  @ApiPropertyOptional({
    description: 'Updated agenda status',
    enum: AgendaStatus,
    example: AgendaStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AgendaStatus)
  status?: AgendaStatus;
}
