import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Opaque refresh token obtained from login or previous refresh.',
    example: 'opaque_token_base64_encoded_random_bytes',
  })
  @IsString()
  refresh_token: string;
}
