import { IsArray, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XML = 'xml',
}

export enum DataCategory {
  PROFILE = 'profile',
  AUTHENTICATION = 'authentication',
  RESTAURANT_DATA = 'restaurant_data',
  ORDERS = 'orders',
  JOB_APPLICATIONS = 'job_applications',
  COMMUNICATIONS = 'communications',
  PREFERENCES = 'preferences',
  CONSENT_RECORDS = 'consent_records',
  ACTIVITY_LOGS = 'activity_logs',
  PAYMENT_INFO = 'payment_info',
  ALL = 'all',
}

export class DataExportRequestDto {
  @ApiProperty({
    description: 'Data categories to export',
    enum: DataCategory,
    isArray: true,
    example: [DataCategory.PROFILE, DataCategory.ORDERS]
  })
  @IsArray()
  @IsEnum(DataCategory, { each: true })
  categories: DataCategory[];

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.JSON
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description: 'Include metadata (timestamps, IPs, etc.)',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = false;

  @ApiProperty({
    description: 'Include deleted/archived data',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean = false;

  @ApiProperty({
    description: 'Date range start (ISO string)',
    required: false
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Date range end (ISO string)',
    required: false
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Email address to send download link',
    required: false
  })
  @IsOptional()
  @IsString()
  emailAddress?: string;

  @ApiProperty({
    description: 'Additional notes or special requests',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}