import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Query,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Express } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileUploadService } from './file-upload.service';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload single file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('category') category?: string,
    @Body('isPublic') isPublic?: string,
    @Body('maxWidth') maxWidth?: string,
    @Body('maxHeight') maxHeight?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const options: any = {
      category: category || 'general',
      isPublic: isPublic === 'true',
      userId,
    };

    if (maxWidth && maxHeight) {
      options.resize = {
        width: parseInt(maxWidth),
        height: parseInt(maxHeight),
      };
    }

    return this.fileUploadService.uploadSingle(file, options);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @Body('category') category?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const options = {
      category: category || 'general',
      isPublic: isPublic === 'true',
      userId,
    };

    return this.fileUploadService.uploadMultiple(files, options);
  }

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and process image with thumbnails' })
  @ApiResponse({ status: 201, description: 'Image uploaded and processed' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('category') category?: string,
    @Body('generateThumbnails') generateThumbnails?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image provided');
    }

    return this.fileUploadService.uploadImage(file, {
      category: category || 'images',
      userId,
      generateThumbnails: generateThumbnails !== 'false',
      isPublic: true,
    });
  }

  @Get('my-files')
  @ApiOperation({ summary: 'Get user uploaded files' })
  @ApiResponse({ status: 200, description: 'User files retrieved' })
  async getUserFiles(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fileUploadService.getUserFiles(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0,
    });
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file details' })
  @ApiResponse({ status: 200, description: 'File details retrieved' })
  async getFileDetails(@Param('fileId') fileId: string) {
    return this.fileUploadService.getFileById(fileId);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileUploadService.deleteFile(fileId, userId);
  }

  @Post('generate-signed-url')
  @ApiOperation({ summary: 'Generate signed URL for direct upload' })
  @ApiResponse({ status: 201, description: 'Signed URL generated' })
  async generateSignedUrl(
    @CurrentUser('id') userId: string,
    @Body() body: {
      fileName: string;
      fileType: string;
      category?: string;
    },
  ) {
    return this.fileUploadService.generateSignedUrl({
      fileName: body.fileName,
      fileType: body.fileType,
      category: body.category || 'general',
      userId,
    });
  }

  @Get('stats/usage')
  @ApiOperation({ summary: 'Get user file usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved' })
  async getUsageStats(@CurrentUser('id') userId: string) {
    return this.fileUploadService.getUserStorageStats(userId);
  }
}