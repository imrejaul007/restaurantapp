import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateForumDto {
  @ApiProperty({ example: 'Restaurant Tips & Tricks' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Share tips and tricks for running a successful restaurant' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ example: 'Restaurant Management' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  category!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ example: 'No spam or promotional content allowed' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;
}

export class UpdateForumDto {
  @ApiPropertyOptional({ example: 'Updated Forum Name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'Updated category' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: 'Updated forum rules' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;
}