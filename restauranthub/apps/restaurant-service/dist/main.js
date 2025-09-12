"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const microservices_1 = require("@nestjs/microservices");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const microservice = app.connectMicroservice({
        transport: microservices_1.Transport.REDIS,
        options: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379') || 6379,
            password: process.env.REDIS_PASSWORD,
            retryAttempts: 5,
            retryDelay: 3000,
        },
    });
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('RestaurantHub Restaurant Service')
        .setDescription('Restaurant Management microservice API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('restaurants')
        .addTag('menus')
        .addTag('categories')
        .addTag('media')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.use('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'restaurant-service',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    await app.startAllMicroservices();
    const port = process.env.RESTAURANT_SERVICE_PORT || 3003;
    await app.listen(port);
    console.log(`Restaurant Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map