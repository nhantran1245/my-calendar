import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AgendaEventStatus } from '../enums/agenda-event-status.enum';
import { CreateAgendaEventDto } from './create-agenda-event.dto';

export class UpdateAgendaEventDto extends PartialType(CreateAgendaEventDto) {
  @ApiPropertyOptional({
    description: 'Updated event status',
    enum: AgendaEventStatus,
    example: AgendaEventStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AgendaEventStatus)
  status?: AgendaEventStatus;
}
