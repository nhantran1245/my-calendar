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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { ToggleCompleteDto } from './dto/toggle-complete.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateScope } from './enums/update-scope.enum';
import { EventsService } from './events.service';
import { RecurringEventsService } from './recurring-events.service';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly recurringEventsService: RecurringEventsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List events for a specific month' })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    example: 6,
    description: '1–12',
  })
  @ApiQuery({
    name: 'includeCompleted',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of events for the month' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid query parameters' })
  async findByMonth(@Query() query: QueryEventsDto) {
    const includeCompleted = query.includeCompleted ?? true;
    const events = await this.eventsService.findByMonth(
      query.year,
      query.month,
      includeCompleted,
    );
    return {
      data: events,
      meta: {
        year: query.year,
        month: query.month,
        count: events.length,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new single event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateEventDto) {
    return this.eventsService.create(dto, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  @ApiParam({ name: 'id', description: 'Event ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event (scope-aware for recurring instances)' })
  @ApiParam({ name: 'id', description: 'Event ID (UUID)', type: String })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: UpdateScope,
    description:
      'For recurring instances: this_only (default), this_and_following, all',
  })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event updated successfully' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot edit past events or validation error',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Query('scope') scope?: UpdateScope,
  ) {
    const event = await this.eventsService.findOne(id);

    // If the event is a recurring instance and a non-default scope is requested,
    // delegate to RecurringEventsService for batch operations
    if (event.recurringEventId && scope && scope !== UpdateScope.THIS_ONLY) {
      return this.recurringEventsService.updateInstance(
        event,
        dto as Record<string, unknown>,
        scope,
      );
    }

    // Default: update this event only (marks as override if it's an instance)
    if (event.recurringEventId) {
      return this.recurringEventsService.updateInstance(
        event,
        dto as Record<string, unknown>,
        UpdateScope.THIS_ONLY,
      );
    }

    const updated = await this.eventsService.update(id, dto);
    return { event: updated, affectedInstanceCount: null };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (scope-aware for recurring instances)' })
  @ApiParam({ name: 'id', description: 'Event ID (UUID)', type: String })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: UpdateScope,
    description:
      'For recurring instances: this_only (default), this_and_following, all',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Event deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async remove(
    @Param('id') id: string,
    @Query('scope') scope?: UpdateScope,
  ) {
    const event = await this.eventsService.findOne(id);

    if (event.recurringEventId) {
      await this.recurringEventsService.deleteInstance(
        event,
        scope ?? UpdateScope.THIS_ONLY,
      );
      return;
    }

    await this.eventsService.remove(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Toggle event completion status' })
  @ApiParam({ name: 'id', description: 'Event ID (UUID)', type: String })
  @ApiBody({ type: ToggleCompleteDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Completion status updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  toggleComplete(@Param('id') id: string, @Body() dto: ToggleCompleteDto) {
    return this.eventsService.toggleComplete(id, dto.isCompleted);
  }
}
