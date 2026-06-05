import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RecurringEventsController } from './recurring-events.controller';
import { RecurringEventsService } from './recurring-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [RecurringEventsController, EventsController],
  providers: [EventsService, RecurringEventsService],
  exports: [EventsService, RecurringEventsService],
})
export class EventsModule {}
