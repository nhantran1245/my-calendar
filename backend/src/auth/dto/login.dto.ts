import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email address.',
    example: 'john_doe',
  })
  @IsString()
  username_or_email: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
