import { IsArray, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DeletionScope {
  PROFILE_ONLY = 'profile_only',
  ALL_DATA = 'all_data',
  SPECIFIC_CATEGORIES = 'specific_categories',
  ACCOUNT_CLOSURE = 'account_closure',
}

export enum DeletionReason {
  NO_LONGER_NEEDED = 'no_longer_needed',
  WITHDRAW_CONSENT = 'withdraw_consent',
  OBJECT_TO_PROCESSING = 'object_to_processing',
  UNLAWFUL_PROCESSING = 'unlawful_processing',
  LEGAL_OBLIGATION = 'legal_obligation',
  OTHER = 'other',
}

export class DataDeletionRequestDto {
  @ApiProperty({
    description: 'Scope of data deletion',
    enum: DeletionScope,
    example: DeletionScope.ALL_DATA
  })
  @IsEnum(DeletionScope)
  scope: DeletionScope;

  @ApiProperty({
    description: 'Reason for deletion request',
    enum: DeletionReason,
    example: DeletionReason.WITHDRAW_CONSENT
  })
  @IsEnum(DeletionReason)
  reason: DeletionReason;

  @ApiProperty({
    description: 'Specific data categories to delete (required if scope is SPECIFIC_CATEGORIES)',
    required: false,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({
    description: 'Additional details about the deletion request',
    required: false
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({
    description: 'Confirmation that user understands consequences',
    default: false
  })
  @IsBoolean()
  confirmUnderstanding: boolean;

  @ApiProperty({
    description: 'Keep account for legal/business obligations',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  retainForLegalReasons?: boolean = false;
}