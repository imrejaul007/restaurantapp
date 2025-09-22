import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  // Basic CORS for development
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

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

  const port = configService.get('API_PORT', 3001);
  const host = configService.get('API_HOST', '127.0.0.1');

  await app.listen(port, host);

  const baseUrl = `http://${host}:${port}`;
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');

  console.log(`🚀 RestaurantHub API (Basic) is running!`);
  console.log(`📊 API Endpoint: ${baseUrl}/${apiPrefix}`);
  console.log(`🔧 Health Check: ${baseUrl}/${apiPrefix}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();