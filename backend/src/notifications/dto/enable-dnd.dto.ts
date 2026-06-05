import { IsInt, Max, Min } from 'class-validator';
import { DND_MAX_MINUTES, DND_MIN_MINUTES } from '../../constants';

export class EnableDndDto {
  @IsInt()
  @Min(DND_MIN_MINUTES)
  @Max(DND_MAX_MINUTES)
  durationMinutes: number;
}
