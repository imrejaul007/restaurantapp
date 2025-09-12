import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
import * as express from 'express';
import helmet from 'helmet';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          }),
        ),
      }),
      // Log to file in production
      ...(process.env.NODE_ENV === 'production' ? [
        new winston.transports.File({
          filename: 'logs/(error as Error).log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ] : []),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  // Trust proxy (for accurate IP addresses behind load balancers)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: configService.get('RATE_LIMIT_MAX', 1000), // limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for certain IPs in development
    skip: (req: any) => {
      if (process.env.NODE_ENV === 'development') {
        return req.ip === '127.0.0.1' || req.ip === '::1';
      }
      return false;
    },
  });
  app.use(limiter);

  // Strict rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
    message: {
      error: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
    },
  });
  app.use('/api/v1/auth', authLimiter);

  // Security headers with Helmet
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.razorpay.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Body size limits
  app.use('/api/v1/upload', express.raw({ limit: '50mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression({
    filter: (req: any, res: any) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  }));

  // CORS with more specific configuration
  const allowedOrigins = [
    configService.get('FRONTEND_URL'),
    'http://localhost:3000',
    'http://localhost:3001',
    'https://restauranthub.com',
    'https://www.restauranthub.com',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl requests, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  });

  // CSRF Protection (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.use(csurf({
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
    }));
  }

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prisma shutdown hook
  await prismaService.enableShutdownHooks(app);

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RestaurantHub API')
    .setDescription(`
      The RestaurantHub API - Complete B2B/B2C SaaS platform for the restaurant industry.
      
      Features:
      - Multi-role authentication (Admin, Restaurant, Vendor, Employee, Customer)
      - Restaurant management and operations
      - B2B marketplace with vendor integration
      - Job portal and HR management
      - Real-time messaging and notifications
      - Payment processing and billing
      - Analytics and reporting
      - Training and certification system
      
      For support, contact: support@restauranthub.com
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'api-key',
    )
    .addServer('http://localhost:3000/api/v1', 'Development server')
    .addServer('https://api.restauranthub.com/api/v1', 'Production server')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User profile management')
    .addTag('restaurants', 'Restaurant operations and management')
    .addTag('vendors', 'Vendor and supplier management')
    .addTag('employees', 'Employee management and HR')
    .addTag('jobs', 'Job portal and applications')
    .addTag('marketplace', 'B2B product marketplace')
    .addTag('orders', 'Order management and fulfillment')
    .addTag('payments', 'Payment processing and billing')
    .addTag('messaging', 'Real-time messaging system')
    .addTag('notifications', 'Notification management')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('admin', 'Administrative operations')
    .addTag('files', 'File upload and management')
    .addTag('support', 'Customer support system')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'RestaurantHub API Documentation',
    customfavIcon: '/favicon.ico',
  });

  // Global error handling
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      logger.error('Error stack:', reason.stack);
      logger.error('Error message:', reason.message);
    } else {
      logger.error('Non-error reason:', JSON.stringify(reason, null, 2));
    }
    // Temporarily comment out process.exit to see the actual error
    // process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully...`);
    
    app.close().then(() => {
      logger.log('HTTP server closed.');
      
      // Close database connections
      prismaService.$disconnect()
        .then(() => {
          logger.log('Database connections closed.');
          process.exit(0);
        })
        .catch((error: any) => {
          logger.error('Error during database disconnect:', error);
          process.exit(1);
        });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  const port = configService.get('API_PORT', 3000);
  const host = configService.get('API_HOST', '0.0.0.0');
  
  await app.listen(port, host);

  const baseUrl = `http://${host}:${port}`;
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  
  logger.log(`🚀 RestaurantHub API is running!`);
  logger.log(`📊 API Endpoint: ${baseUrl}/${apiPrefix}`);
  logger.log(`📚 Documentation: ${baseUrl}/docs`);
  logger.log(`🔧 Health Check: ${baseUrl}/${apiPrefix}/health`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📈 Rate Limit: ${configService.get('RATE_LIMIT_MAX', 1000)} requests per 15 minutes`);
  logger.log(`🔐 Security: CORS, Helmet, Rate Limiting ${process.env.NODE_ENV === 'production' ? '+ CSRF' : ''}`);
}

bootstrap();