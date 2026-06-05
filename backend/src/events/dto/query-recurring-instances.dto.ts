import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class QueryRecurringInstancesDto {
  @ApiPropertyOptional({ type: Number, default: 50 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Return instances from this date onward (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Return instances up to this date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
