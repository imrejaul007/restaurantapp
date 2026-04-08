import { IsEmail, IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsSecureEmail, IsSafeText } from '../../../common/validators/security.validator';

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Valid email address from a permanent domain'
  })
  @IsSecureEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password'
  })
  @IsString()
  @Length(1, 128, { message: 'Password length must be between 1 and 128 characters' })
  password!: string;

  @ApiProperty({
    example: 'admin',
    required: false,
    description: 'Optional role hint for authentication'
  })
  @IsOptional()
  @IsSafeText()
  @Length(1, 50, { message: 'Role must be between 1 and 50 characters' })
  role?: string;
}