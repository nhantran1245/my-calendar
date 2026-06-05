import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RemindersService } from './reminders.service';

@Module({
  imports: [EventsModule, NotificationsModule],
  providers: [RemindersService],
})
export class RemindersModule {}
