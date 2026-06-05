import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NOTIFICATIONS_SSE_EVENT_NAME } from '../constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AnalyticsByDayQueryDto } from './dto/analytics-by-day-query.dto';
import { EnableDndDto } from './dto/enable-dnd.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  findAll(@Req() req: AuthenticatedRequest, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAll(req.user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count (badge)' })
  unreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @Get('dnd/status')
  @ApiOperation({ summary: 'Get current Do Not Disturb status' })
  getDndStatus(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getDndStatus(req.user.sub);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get notification analytics summary' })
  getAnalyticsSummary(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationsService.getAnalyticsSummary(req.user.sub, from, to);
  }

  @Get('analytics/by-day')
  @ApiOperation({ summary: 'Get notification metrics grouped by day' })
  getAnalyticsByDay(
    @Req() req: AuthenticatedRequest,
    @Query() query: AnalyticsByDayQueryDto,
  ) {
    return this.notificationsService.getAnalyticsByDay(req.user.sub, query);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events stream for real-time notifications' })
  stream(@Req() req: AuthenticatedRequest): Observable<MessageEvent> {
    const userId = req.user.sub;
    return fromEvent(this.eventEmitter, NOTIFICATIONS_SSE_EVENT_NAME).pipe(
      filter((notification: Notification) => notification.userId === userId),
      map((notification: Notification) => ({ data: notification }) as MessageEvent),
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(id, req.user.sub);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a notification' })
  dismiss(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.dismiss(id, req.user.sub);
  }

  @Post('dismiss-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss all notifications for the current user' })
  dismissAll(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.dismissAll(req.user.sub);
  }

  @Post('dnd')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable Do Not Disturb mode' })
  enableDnd(@Req() req: AuthenticatedRequest, @Body() dto: EnableDndDto) {
    return this.notificationsService.enableDnd(req.user.sub, dto.durationMinutes);
  }

  @Delete('dnd')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable Do Not Disturb mode' })
  disableDnd(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.disableDnd(req.user.sub);
  }
}
