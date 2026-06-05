import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '3-20 alphanumeric characters (and underscores). Must be unique.',
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only alphanumeric characters and underscores',
  })
  username: string;

  @ApiProperty({
    description: 'Valid email address. Must be unique.',
    maxLength: 255,
    format: 'email',
    example: 'john@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description:
      'At least 8 characters with one uppercase, one lowercase, and one digit.',
    minLength: 8,
    maxLength: 128,
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password: string;
}
