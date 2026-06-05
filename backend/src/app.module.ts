import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_TIMEZONE } from './constants';
import { AgendasModule } from './agendas/agendas.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DATABASE_HOST', 'localhost'),
        port: cfg.get<number>('DATABASE_PORT', 5432),
        database: cfg.get('DATABASE_NAME', 'my_calendar'),
        username: cfg.get('DATABASE_USER', 'calendar_user'),
        password: cfg.get('DATABASE_PASSWORD', 'calendar_pass'),
        autoLoadEntities: true,
        synchronize: false, // schema managed by Flyway
        extra: { options: `-c timezone=${APP_TIMEZONE}` },
      }),
    }),
    AgendasModule,
    AuthModule,
    EventsModule,
    NotificationsModule,
    RemindersModule,
  ],
})
export class AppModule {}
