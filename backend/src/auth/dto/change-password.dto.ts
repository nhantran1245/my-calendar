import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: "User's current password for verification.",
    example: 'OldPass123',
  })
  @IsString()
  current_password: string;

  @ApiProperty({
    description:
      'New password (same strength requirements as registration). Must be different from current password.',
    minLength: 8,
    maxLength: 128,
    example: 'NewSecurePass456',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'new_password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  new_password: string;
}
