import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RezClientModule } from '@restauranthub/rez-client';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FileStorageService } from './file-storage.service';
import { ShiftSyncService } from './shift-sync.service';
import { ShiftWebhookController } from './shift-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    RezClientModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // In production, you'd want to use cloud storage
          // For now, store files locally in uploads directory
          let uploadPath = './uploads/';

          if (file.fieldname === 'resume') {
            uploadPath += 'resumes/';
          } else {
            uploadPath += 'jobs/';
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
          cb(null, `${file.fieldname}_${name}_${uniqueSuffix}${ext}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        // File type validation
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      }
    })
  ],
  controllers: [JobsController, ShiftWebhookController],
  providers: [JobsService, FileStorageService, ShiftSyncService],
  exports: [JobsService, FileStorageService, ShiftSyncService]
})
export class JobsModule {}