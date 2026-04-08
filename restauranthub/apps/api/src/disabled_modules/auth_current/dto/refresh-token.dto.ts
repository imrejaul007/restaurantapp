import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidJWT } from '../../../common/validators/security.validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsValidJWT()
  refreshToken!: string;
}