import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidJWT, IsStrongPassword } from '../../../common/validators/security.validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Valid JWT reset token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsValidJWT()
  token!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'Strong password with at least 12 characters, including uppercase, lowercase, number, and special character'
  })
  @IsStrongPassword()
  newPassword!: string;
}