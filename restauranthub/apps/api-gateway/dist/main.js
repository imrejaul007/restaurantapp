"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3001',
            'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('RestaurantHub API Gateway')
        .setDescription('Unified API Gateway for all microservices')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('gateway')
        .addTag('health')
        .addTag('metrics')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.use('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'api-gateway',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: [],
        });
    });
    const port = process.env.API_GATEWAY_PORT || 3000;
    await app.listen(port);
    console.log(`API Gateway is running on: http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map