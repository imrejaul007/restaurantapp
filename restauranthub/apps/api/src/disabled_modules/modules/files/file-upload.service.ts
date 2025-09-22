import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FileType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
// AWS SDK is not installed - using stub type for now
// import { S3 } from 'aws-sdk';

// Stub S3 type to prevent TypeScript errors
interface S3 {
  upload: (params: any) => { promise: () => Promise<any> };
  deleteObject: (params: any) => { promise: () => Promise<any> };
  headObject: (params: any) => { promise: () => Promise<any> };
}
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  generateThumbnail?: boolean;
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UploadResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: FileType;
  folder?: string;
  tags: string[];
}

export interface BulkUploadResult {
  successful: UploadResult[];
  failed: { file: string; error: string; }[];
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private s3: S3;
  private useCloudinary: boolean;
  private useS3: boolean;
  private useLocal: boolean;
  private uploadPath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize Cloudinary
    if (this.configService.get('CLOUDINARY_CLOUD_NAME')) {
      cloudinary.config({
        cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      });
      this.useCloudinary = true;
      this.logger.log('Cloudinary configured');
    }

    // Initialize AWS S3 (currently disabled - AWS SDK not installed)
    if (this.configService.get('AWS_S3_ACCESS_KEY_ID')) {
      // this.s3 = new S3({
      //   accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY_ID'),
      //   secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      //   region: this.configService.get('AWS_S3_REGION'),
      // });
      // this.useS3 = true;
      this.logger.warn('AWS S3 configuration found but SDK not available - S3 uploads disabled');
    }

    // Local storage fallback
    if (!this.useCloudinary && !this.useS3) {
      this.useLocal = true;
      this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
      fs.ensureDirSync(this.uploadPath);
      this.logger.log('Using local storage');
    }
  }

  async uploadSingle(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadResult> {
    this.validateFile(file, options);

    const fileType = this.getFileType(file.mimetype);
    const processedFile = await this.processFile(file, options);
    
    try {
      let uploadResult: any;
      let thumbnailResult: any;

      if (this.useCloudinary) {
        uploadResult = await this.uploadToCloudinary(processedFile, options);
        if (options.generateThumbnail && fileType === FileType.IMAGE) {
          thumbnailResult = await this.generateThumbnailCloudinary(processedFile, options);
        }
      } else if (this.useS3) {
        uploadResult = await this.uploadToS3(processedFile, options);
        if (options.generateThumbnail && fileType === FileType.IMAGE) {
          thumbnailResult = await this.generateThumbnailS3(processedFile, options);
        }
      } else {
        uploadResult = await this.uploadToLocal(processedFile, options);
        if (options.generateThumbnail && fileType === FileType.IMAGE) {
          thumbnailResult = await this.generateThumbnailLocal(processedFile, options);
        }
      }

      // Save file record to database
      const fileRecord = await this.prisma.file.create({
        data: {
          id: uuidv4(),
          filename: uploadResult.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          type: fileType,
          url: uploadResult.url,
          thumbnailUrl: thumbnailResult?.url,
          uploadedBy: options.userId,
          folder: options.folder,
          tags: options.tags || [],
          isPublic: options.isPublic || false,
          allowedUsers: options.userId ? [options.userId] : [],
        },
      });

      // Clean up temporary files
      if (processedFile.path !== file.path) {
        await fs.remove(processedFile.path);
      }

      return {
        id: fileRecord.id,
        url: fileRecord.url,
        thumbnailUrl: fileRecord.thumbnailUrl || undefined,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        type: fileRecord.type,
        folder: fileRecord.folder || undefined,
        tags: fileRecord.tags,
      };

    } catch (error) {
      this.logger.error(`File upload failed: ${(error as Error).message}`, (error as Error).stack);
      
      // Clean up temporary files on error
      if (processedFile.path) {
        await fs.remove(processedFile.path).catch(() => {});
      }
      
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    options: FileUploadOptions = {},
  ): Promise<BulkUploadResult> {
    const successful: UploadResult[] = [];
    const failed: { file: string; error: string }[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadSingle(file, options);
        successful.push(result);
      } catch (error) {
        failed.push({
          file: file.originalname,
          error: (error as Error).message,
        });
      }
    }

    return { successful, failed };
  }

  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Check permissions
    if (!file.isPublic && userId && !file.allowedUsers.includes(userId)) {
      throw new BadRequestException('Unauthorized to delete this file');
    }

    try {
      // Delete from storage
      if (this.useCloudinary) {
        await this.deleteFromCloudinary(file.url);
        if (file.thumbnailUrl) {
          await this.deleteFromCloudinary(file.thumbnailUrl);
        }
      } else if (this.useS3) {
        await this.deleteFromS3(file.url);
        if (file.thumbnailUrl) {
          await this.deleteFromS3(file.thumbnailUrl);
        }
      } else {
        await this.deleteFromLocal(file.url);
        if (file.thumbnailUrl) {
          await this.deleteFromLocal(file.thumbnailUrl);
        }
      }

      // Delete from database
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      this.logger.log(`File deleted: ${fileId}`);

    } catch (error) {
      this.logger.error(`File deletion failed: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('File deletion failed');
    }
  }

  async getFile(fileId: string, userId?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Check permissions
    if (!file.isPublic && userId && !file.allowedUsers.includes(userId)) {
      throw new BadRequestException('Unauthorized to access this file');
    }

    return file;
  }

  async getUserFiles(userId: string, options?: {
    type?: FileType;
    folder?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.file.findMany({
      where: {
        OR: [
          { uploadedBy: userId },
          { allowedUsers: { has: userId } },
          { isPublic: true },
        ],
        ...(options?.type && { type: options.type }),
        ...(options?.folder && { folder: options.folder }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  private validateFile(file: Express.Multer.File, options: FileUploadOptions): void {
    // Check file size
    const maxSize = options.maxSize ?? this.configService.get('MAX_FILE_SIZE', 50 * 1024 * 1024);
    if (maxSize && file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxSize} bytes`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Additional security checks
    if (!file.originalname.match(/^[a-zA-Z0-9._-]+$/)) {
      throw new BadRequestException('Invalid filename characters');
    }
  }

  private async processFile(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<Express.Multer.File> {
    const fileType = this.getFileType(file.mimetype);

    // Process images
    if (fileType === FileType.IMAGE && options.resize) {
      const tempPath = path.join(__dirname, '../../../temp', `${uuidv4()}-${file.originalname}`);
      await fs.ensureDir(path.dirname(tempPath));

      try {
        let pipeline = sharp(file.buffer);

        if (options.resize.width || options.resize.height) {
          pipeline = pipeline.resize(options.resize.width, options.resize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        if (options.resize.quality) {
          pipeline = pipeline.jpeg({ quality: options.resize.quality });
        }

        const processedBuffer = await pipeline.toBuffer();
        await fs.writeFile(tempPath, processedBuffer);

        return {
          ...file,
          buffer: processedBuffer,
          size: processedBuffer.length,
          path: tempPath,
        };

      } catch (error) {
        this.logger.error(`Image processing failed: ${(error as Error).message}`);
        throw new InternalServerErrorException('Image processing failed');
      }
    }

    return file;
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `${this.configService.get('CLOUDINARY_FOLDER', 'restauranthub')}/${options.folder || 'general'}`,
        public_id: uuidv4(),
        resource_type: 'auto',
        tags: options.tags || [],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result?.secure_url || '',
              filename: result?.public_id || '',
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private async uploadToS3(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string; filename: string }> {
    const filename = `${options.folder || 'general'}/${uuidv4()}-${file.originalname}`;
    
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: options.isPublic ? 'public-read' : 'private',
      Metadata: {
        uploadedBy: options.userId || 'anonymous',
        originalName: file.originalname,
      },
    };

    const result = await this.s3.upload(params).promise();
    
    return {
      url: result.Location,
      filename,
    };
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string; filename: string }> {
    const folder = path.join(this.uploadPath, options.folder || 'general');
    await fs.ensureDir(folder);

    const filename = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(folder, filename);

    await fs.writeFile(filePath, file.buffer);

    const baseUrl = this.configService.get('API_BASE_URL', 'http://localhost:3000');
    const url = `${baseUrl}/uploads/${options.folder || 'general'}/${filename}`;

    return { url, filename };
  }

  private async generateThumbnailCloudinary(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `${this.configService.get('CLOUDINARY_FOLDER')}/thumbnails/${options.folder || 'general'}`,
        public_id: `thumb_${uuidv4()}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', quality: 'auto:low' }
        ],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({ url: result?.secure_url || '' });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private async generateThumbnailS3(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string }> {
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    const filename = `thumbnails/${options.folder || 'general'}/thumb_${uuidv4()}.jpg`;
    
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
      Key: filename,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      ACL: options.isPublic ? 'public-read' : 'private',
    };

    const result = await this.s3.upload(params).promise();
    return { url: result.Location };
  }

  private async generateThumbnailLocal(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): Promise<{ url: string }> {
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    const folder = path.join(this.uploadPath, 'thumbnails', options.folder || 'general');
    await fs.ensureDir(folder);

    const filename = `thumb_${uuidv4()}.jpg`;
    const filePath = path.join(folder, filename);

    await fs.writeFile(filePath, thumbnailBuffer);

    const baseUrl = this.configService.get('API_BASE_URL', 'http://localhost:3000');
    const url = `${baseUrl}/uploads/thumbnails/${options.folder || 'general'}/${filename}`;

    return { url };
  }

  private async deleteFromCloudinary(url: string): Promise<void> {
    try {
      const publicId = this.extractCloudinaryPublicId(url);
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Cloudinary deletion failed: ${(error as Error).message}`);
    }
  }

  private async deleteFromS3(url: string): Promise<void> {
    try {
      const key = this.extractS3Key(url);
      await this.s3.deleteObject({
        Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
        Key: key,
      }).promise();
    } catch (error) {
      this.logger.error(`S3 deletion failed: ${(error as Error).message}`);
    }
  }

  private async deleteFromLocal(url: string): Promise<void> {
    try {
      const filePath = this.extractLocalPath(url);
      await fs.remove(filePath);
    } catch (error) {
      this.logger.error(`Local file deletion failed: ${(error as Error).message}`);
    }
  }

  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  private extractCloudinaryPublicId(url: string): string {
    const matches = url.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : '';
  }

  private extractS3Key(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  }

  private extractLocalPath(url: string): string {
    const urlObj = new URL(url);
    return path.join(this.uploadPath, urlObj.pathname.replace('/uploads/', ''));
  }

  async generateSignedUrl(
    fileIdOrOptions: string | {
      fileName: string;
      fileType: string;
      category?: string;
      userId: string;
    },
    expiresIn: number = 3600
  ): Promise<string | { uploadUrl: string; fileId: string }> {
    if (typeof fileIdOrOptions === 'string') {
      const file = await this.getFile(fileIdOrOptions);
      
      if (this.useS3) {
        const key = this.extractS3Key(file.url);
        // Note: AWS SDK not available, using stub implementation
        return `${file.url}?expires=${Date.now() + expiresIn * 1000}`;
      }

      // For Cloudinary and local storage, return the direct URL
      return file.url;
    } else {
      const options = fileIdOrOptions;
      // Handle direct upload URL generation
      const fileId = uuidv4();
      const fileName = `${options.category || 'general'}/${fileId}-${options.fileName}`;
      
      // For now, return a stub implementation
      return {
        uploadUrl: `${this.configService.get('API_BASE_URL', 'http://localhost:3000')}/files/upload`,
        fileId,
      };
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    options: {
      category?: string;
      userId: string;
      generateThumbnails?: boolean;
      isPublic?: boolean;
    },
  ): Promise<UploadResult> {
    // Validate that file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const uploadOptions: FileUploadOptions = {
      folder: options.category || 'images',
      userId: options.userId,
      isPublic: options.isPublic || false,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      generateThumbnail: options.generateThumbnails !== false,
    };

    return this.uploadSingle(file, uploadOptions);
  }

  async getFileById(fileId: string): Promise<any> {
    return this.getFile(fileId);
  }

  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    usedSpace: string;
    fileTypes: { [key: string]: number };
    recentUploads: number;
  }> {
    const userFiles = await this.prisma.file.findMany({
      where: {
        OR: [
          { uploadedBy: userId },
          { allowedUsers: { has: userId } },
        ],
      },
    });

    const totalFiles = userFiles.length;
    const totalSize = userFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Calculate file types distribution
    const fileTypes: { [key: string]: number } = {};
    userFiles.forEach(file => {
      const type = file.type || 'OTHER';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    // Count recent uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUploads = userFiles.filter(file => 
      file.createdAt && new Date(file.createdAt) > thirtyDaysAgo
    ).length;

    // Format size in human readable format
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return {
      totalFiles,
      totalSize,
      usedSpace: formatSize(totalSize),
      fileTypes,
      recentUploads,
    };
  }
}