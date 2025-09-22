import { IsBoolean, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ConsentPreferencesDto {
  @ApiProperty({ description: 'Consent to marketing communications' })
  @IsBoolean()
  marketing: boolean;

  @ApiProperty({ description: 'Consent to analytics and tracking' })
  @IsBoolean()
  analytics: boolean;

  @ApiProperty({ description: 'Consent to functional cookies' })
  @IsBoolean()
  functionalCookies: boolean;

  @ApiProperty({ description: 'Consent to performance cookies' })
  @IsBoolean()
  performanceCookies: boolean;

  @ApiProperty({ description: 'Consent to data sharing with third parties' })
  @IsBoolean()
  thirdPartySharing: boolean;

  @ApiProperty({ description: 'Consent to profiling for personalized services' })
  @IsBoolean()
  profiling: boolean;

  @ApiProperty({ description: 'Consent to automated decision making' })
  @IsBoolean()
  automatedDecisionMaking: boolean;

  @ApiProperty({ description: 'Consent to location tracking', required: false })
  @IsOptional()
  @IsBoolean()
  locationTracking?: boolean;

  @ApiProperty({ description: 'Consent to push notifications', required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}

export class ConsentDto {
  @ApiProperty({ description: 'User consent preferences' })
  @ValidateNested()
  @Type(() => ConsentPreferencesDto)
  preferences: ConsentPreferencesDto;

  @ApiProperty({ description: 'Specific purposes consented to', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  purposes?: string[];

  @ApiProperty({ description: 'User IP address for consent record', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent for consent record', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Consent method (e.g., cookie_banner, explicit_form)', required: false })
  @IsOptional()
  @IsString()
  consentMethod?: string;
}