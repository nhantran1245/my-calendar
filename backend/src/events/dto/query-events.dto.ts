import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_MONTH, MIN_MONTH, MIN_YEAR } from '../../constants';

export class QueryEventsDto {
  @ApiProperty({ description: 'Calendar year (e.g. 2026)', example: 2026 })
  @IsInt()
  @Min(MIN_YEAR)
  @Transform(({ value }) => Number(value))
  year: number;

  @ApiProperty({
    description: 'Calendar month (1–12, where 1 = January)',
    minimum: MIN_MONTH,
    maximum: MAX_MONTH,
    example: 6,
  })
  @IsInt()
  @Min(MIN_MONTH)
  @Max(MAX_MONTH)
  @Transform(({ value }) => Number(value))
  month: number;

  @ApiPropertyOptional({
    description: 'Include completed events in response (default true)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  includeCompleted?: boolean = true;
}
