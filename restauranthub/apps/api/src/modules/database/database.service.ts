import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseService extends PrismaService {
  constructor(configService: ConfigService) {
    super(configService);
  }
}