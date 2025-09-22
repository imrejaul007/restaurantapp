import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: any;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;

  constructor(success: boolean, data?: T, message?: string, error?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data?: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error(message: string, error?: any): BaseResponseDto {
    return new BaseResponseDto(false, null, message, error);
  }
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;

  constructor(statusCode: number, message: string, path: string, error?: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

export class SuccessResponseDto<T = any> {
  @ApiProperty({ description: 'Success status', default: true })
  success: boolean = true;

  @ApiPropertyOptional({ description: 'Success message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;

  constructor(data?: T, message?: string) {
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}