import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleCompleteDto {
  @ApiProperty({ description: 'New completion status' })
  @IsBoolean()
  isCompleted: boolean;
}
