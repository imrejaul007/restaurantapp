import { IsString, IsUUID, IsOptional, IsArray, IsBoolean, IsEnum, MinLength, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType, PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({ example: 'Best practices for inventory management' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'I wanted to share some insights on inventory management...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ example: 'forum-uuid-123' })
  @IsUUID()
  forumId!: string;

  @ApiPropertyOptional({ enum: PostType, example: PostType.DISCUSSION })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ enum: PostVisibility, example: PostVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ example: ['inventory', 'management', 'tips'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: ['attachment-url-1', 'attachment-url-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  attachments?: string[];

  @ApiPropertyOptional({ example: ['image-url-1', 'image-url-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  images?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated post title' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated post content' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: ['updated', 'tags'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiPropertyOptional({ example: ['updated-attachment'] })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class CreateReplyDto {
  @ApiProperty({ example: 'Great insights! I would also add...' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ example: 'parent-comment-uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ReportPostDto {
  @ApiProperty({ example: 'spam' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  reason!: string;

  @ApiPropertyOptional({ example: 'This post contains promotional content that violates forum rules' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}