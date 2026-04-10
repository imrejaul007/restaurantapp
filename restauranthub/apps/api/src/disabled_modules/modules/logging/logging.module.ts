import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggingService } from './logging.service';
import { LoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get('LOG_LEVEL', 'info');
        const nodeEnv = configService.get('NODE_ENV', 'development');
        
        const transports: winston.transport[] = [];

        // Console transport for development
        if (nodeEnv === 'development' || nodeEnv === 'test') {
          transports.push(
            new winston.transports.Console({
              level: logLevel,
              format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
                  let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                  
                  if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta, null, 2)}`;
                  }
                  
                  if (trace) {
                    log += `\n${trace}`;
                  }
                  
                  return log;
                }),
              ),
            }),
          );
        }

        // File transports for production
        if (nodeEnv === 'production') {
          // Error logs
          transports.push(
            new DailyRotateFile({
              level: 'error',
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              ),
            }),
          );

          // Combined logs
          transports.push(
            new DailyRotateFile({
              filename: 'logs/combined-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              ),
            }),
          );

          // Access logs
          transports.push(
            new DailyRotateFile({
              filename: 'logs/access-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              level: 'http',
            }),
          );

          // Security logs
          transports.push(
            new DailyRotateFile({
              filename: 'logs/security-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '90d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          );
        }

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.ms(),
          ),
          transports,
          defaultMeta: {
            service: 'restopapa-api',
            version: process.env.npm_package_version || '1.0.0',
            environment: nodeEnv,
          },
          exceptionHandlers: nodeEnv === 'production' ? [
            new DailyRotateFile({
              filename: 'logs/exceptions-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
            }),
          ] : [],
          rejectionHandlers: nodeEnv === 'production' ? [
            new DailyRotateFile({
              filename: 'logs/rejections-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
            }),
          ] : [],
          exitOnError: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LoggingService, LoggingInterceptor],
  exports: [LoggingService, LoggingInterceptor],
})
export class LoggingModule {}