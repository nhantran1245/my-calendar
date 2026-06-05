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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRecurringEventDto } from './dto/create-recurring-event.dto';
import { QueryRecurringEventsDto } from './dto/query-recurring-events.dto';
import { QueryRecurringInstancesDto } from './dto/query-recurring-instances.dto';
import { UpdateRecurringEventDto } from './dto/update-recurring-event.dto';
import { RecurringEventsService } from './recurring-events.service';

@ApiTags('Recurring Events')
@Controller('events/recurring')
export class RecurringEventsController {
  constructor(private readonly recurringEventsService: RecurringEventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring event series' })
  @ApiBody({ type: CreateRecurringEventDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Series and instances created. Returns template + instance count.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() dto: CreateRecurringEventDto) {
    const { event, instancesCreated, instancesCreatedUntil } =
      await this.recurringEventsService.create(dto);
    return { event, instancesCreated, instancesCreatedUntil };
  }

  @Get()
  @ApiOperation({ summary: 'List all recurring event series (templates)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of series' })
  findAll(@Query() query: QueryRecurringEventsDto) {
    return this.recurringEventsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring event series by ID' })
  @ApiParam({ name: 'id', description: 'Series template UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Series details with instance counts' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Series not found' })
  findOne(@Param('id') id: string) {
    return this.recurringEventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring event series' })
  @ApiParam({ name: 'id', description: 'Series template UUID' })
  @ApiBody({ type: UpdateRecurringEventDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Series updated. Returns updated template + affected instance count.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Series not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  update(@Param('id') id: string, @Body() dto: UpdateRecurringEventDto) {
    return this.recurringEventsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recurring event series and all its instances' })
  @ApiParam({ name: 'id', description: 'Series template UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Series deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Series not found' })
  remove(@Param('id') id: string) {
    return this.recurringEventsService.remove(id);
  }

  @Get(':id/instances')
  @ApiOperation({ summary: 'Get all instances of a recurring event series' })
  @ApiParam({ name: 'id', description: 'Series template UUID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'ISO 8601 date' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'ISO 8601 date' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of instances' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Series not found' })
  findInstances(
    @Param('id') id: string,
    @Query() query: QueryRecurringInstancesDto,
  ) {
    return this.recurringEventsService.findInstances(id, query);
  }
}
