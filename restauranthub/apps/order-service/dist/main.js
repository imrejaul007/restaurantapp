"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Restaurant Hub - Order Service')
        .setDescription('Order service for restaurant management platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    });
    const port = process.env.PORT || 3006;
    await app.listen(port);
    console.log(`🚀 Order Service running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map