"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Restaurant Hub - Auth Service')
        .setDescription('Authentication service for restaurant management platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    });
    app.use('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'auth-service',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    const port = process.env.AUTH_SERVICE_PORT || 3004;
    await app.listen(port);
    console.log(`🚀 Auth Service running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map