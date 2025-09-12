"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const nest_winston_1 = require("nest-winston");
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const express = __importStar(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const winston = __importStar(require("winston"));
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const logger = nest_winston_1.WinstonModule.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                })),
            }),
            ...(process.env.NODE_ENV === 'production' ? [
                new winston.transports.File({
                    filename: 'logs/(error as Error).log',
                    level: 'error',
                    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                }),
            ] : []),
        ],
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger });
    const configService = app.get(config_1.ConfigService);
    const prismaService = app.get(prisma_service_1.PrismaService);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: configService.get('RATE_LIMIT_MAX', 1000),
        message: {
            error: 'Too many requests from this IP, please try again later.',
            statusCode: 429,
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            if (process.env.NODE_ENV === 'development') {
                return req.ip === '127.0.0.1' || req.ip === '::1';
            }
            return false;
        },
    });
    app.use(limiter);
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            error: 'Too many authentication attempts, please try again later.',
            statusCode: 429,
        },
    });
    app.use('/api/v1/auth', authLimiter);
    app.use((0, helmet_1.default)({
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
    app.use('/api/v1/upload', express.raw({ limit: '50mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024,
    }));
    const allowedOrigins = [
        configService.get('FRONTEND_URL'),
        'http://localhost:3000',
        'http://localhost:3001',
        'https://restauranthub.com',
        'https://www.restauranthub.com',
    ].filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
                callback(null, true);
            }
            else {
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
    if (process.env.NODE_ENV === 'production') {
        app.use(csurf({
            cookie: {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            },
        }));
    }
    app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    await prismaService.enableShutdownHooks(app);
    const config = new swagger_1.DocumentBuilder()
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
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
    }, 'api-key')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey, methodKey) => methodKey,
    });
    swagger_1.SwaggerModule.setup('docs', app, document, {
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
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        if (reason instanceof Error) {
            logger.error('Error stack:', reason.stack);
            logger.error('Error message:', reason.message);
        }
        else {
            logger.error('Non-error reason:', JSON.stringify(reason, null, 2));
        }
    });
    const gracefulShutdown = (signal) => {
        logger.log(`Received ${signal}. Shutting down gracefully...`);
        app.close().then(() => {
            logger.log('HTTP server closed.');
            prismaService.$disconnect()
                .then(() => {
                logger.log('Database connections closed.');
                process.exit(0);
            })
                .catch((error) => {
                logger.error('Error during database disconnect:', error);
                process.exit(1);
            });
        });
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
//# sourceMappingURL=main.js.map