import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgendasService } from './agendas.service';
import { CreateAgendaEventDto } from './dto/create-agenda-event.dto';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { ListAgendaEventsDto } from './dto/list-agenda-events.dto';
import { ListAgendasDto } from './dto/list-agendas.dto';
import { UpdateAgendaEventDto } from './dto/update-agenda-event.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@ApiTags('Agendas')
@Controller('agendas')
export class AgendasController {
  constructor(private readonly agendasService: AgendasService) {}

  // ==================== Agendas ====================

  @Get()
  @ApiOperation({ summary: 'List agendas with server-side pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of agendas' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid query parameters' })
  async findAll(@Query() query: ListAgendasDto) {
    return this.agendasService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agenda' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agenda created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() dto: CreateAgendaDto) {
    const agenda = await this.agendasService.create(dto);
    return { data: agenda };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agenda details' })
  @ApiParam({ name: 'id', description: 'Agenda ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agenda found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda not found' })
  async findOne(@Param('id') id: string) {
    const agenda = await this.agendasService.findOne(id);
    return { data: agenda };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agenda details' })
  @ApiParam({ name: 'id', description: 'Agenda ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agenda updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    const agenda = await this.agendasService.update(id, dto);
    return { data: agenda };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an agenda' })
  @ApiParam({ name: 'id', description: 'Agenda ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Agenda deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.agendasService.remove(id);
  }

  // ==================== Agenda Events ====================

  @Get(':id/events')
  @ApiOperation({ summary: 'List events within an agenda' })
  @ApiParam({ name: 'id', description: 'Agenda ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of agenda events' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda not found' })
  async findAllEvents(
    @Param('id') agendaId: string,
    @Query() query: ListAgendaEventsDto,
  ) {
    return this.agendasService.findAllEvents(agendaId, query);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Add a new event to an agenda' })
  @ApiParam({ name: 'id', description: 'Agenda ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agenda event created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda or source event not found' })
  async createEvent(
    @Param('id') agendaId: string,
    @Body() dto: CreateAgendaEventDto,
  ) {
    const agendaEvent = await this.agendasService.createEvent(agendaId, dto);
    return { data: agendaEvent };
  }

  @Get(':agendaId/events/:eventId')
  @ApiOperation({ summary: 'Get a specific agenda event' })
  @ApiParam({ name: 'agendaId', description: 'Agenda ID (UUID)', type: String })
  @ApiParam({ name: 'eventId', description: 'Agenda Event ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agenda event found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda or event not found' })
  async findOneEvent(
    @Param('agendaId') agendaId: string,
    @Param('eventId') eventId: string,
  ) {
    const agendaEvent = await this.agendasService.findOneEvent(agendaId, eventId);
    return { data: agendaEvent };
  }

  @Patch(':agendaId/events/:eventId')
  @ApiOperation({ summary: 'Update an agenda event' })
  @ApiParam({ name: 'agendaId', description: 'Agenda ID (UUID)', type: String })
  @ApiParam({ name: 'eventId', description: 'Agenda Event ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agenda event updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda or event not found' })
  async updateEvent(
    @Param('agendaId') agendaId: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateAgendaEventDto,
  ) {
    const agendaEvent = await this.agendasService.updateEvent(agendaId, eventId, dto);
    return { data: agendaEvent };
  }

  @Delete(':agendaId/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an event from an agenda (hard delete)' })
  @ApiParam({ name: 'agendaId', description: 'Agenda ID (UUID)', type: String })
  @ApiParam({ name: 'eventId', description: 'Agenda Event ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Agenda event removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agenda or event not found' })
  async removeEvent(
    @Param('agendaId') agendaId: string,
    @Param('eventId') eventId: string,
  ): Promise<void> {
    await this.agendasService.removeEvent(agendaId, eventId);
  }
}
