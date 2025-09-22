import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './file-upload.service';
import { FilesController } from './files.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [FileUploadService],
  controllers: [FilesController],
  exports: [FileUploadService],
})
export class FilesModule {}