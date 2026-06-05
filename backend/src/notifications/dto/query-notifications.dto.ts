import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { NOTIFICATIONS_DEFAULT_PAGE_SIZE, NOTIFICATIONS_MAX_PAGE_SIZE } from '../../constants';
import { NotificationStatus } from '../enums/notification-status.enum';

export class QueryNotificationsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(NOTIFICATIONS_MAX_PAGE_SIZE)
  take: number = NOTIFICATIONS_DEFAULT_PAGE_SIZE;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDismissed?: boolean;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRead?: boolean;
}
