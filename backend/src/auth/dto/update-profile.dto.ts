import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AVATAR_URL_MAX_LENGTH,
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  TIMEZONE_MAX_LENGTH,
} from '../../constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "User's display name shown in the UI.",
    minLength: 1,
    maxLength: DISPLAY_NAME_MAX_LENGTH,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(DISPLAY_NAME_MAX_LENGTH)
  display_name?: string;

  @ApiPropertyOptional({
    description: 'Short bio or description.',
    maxLength: BIO_MAX_LENGTH,
    example: 'Software engineer and coffee enthusiast.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX_LENGTH)
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL of the user avatar image.',
    maxLength: AVATAR_URL_MAX_LENGTH,
    example: 'https://cdn.example.com/avatars/john.png',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AVATAR_URL_MAX_LENGTH)
  avatar_url?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone string (e.g. "America/New_York").',
    maxLength: TIMEZONE_MAX_LENGTH,
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  @MaxLength(TIMEZONE_MAX_LENGTH)
  timezone?: string;
}
