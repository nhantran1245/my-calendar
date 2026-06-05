import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: "The refresh token to revoke (this device's session).",
    example: 'opaque_token_base64_encoded_random_bytes',
  })
  @IsString()
  refresh_token: string;
}
