import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsSecureEmail } from '../../../common/validators/security.validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Valid email address from a permanent domain'
  })
  @IsSecureEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;
}