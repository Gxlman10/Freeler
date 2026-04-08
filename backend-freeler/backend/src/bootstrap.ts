import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppModule } from './app.module';

export async function createNestApp() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const appConfig = configService.get<{
    port?: number;
    swaggerPath?: string;
    corsOrigins?: string[];
  }>('app');

  const fallbackOrigins = ['http://localhost:5173', 'http://localhost:4173'];
  const configuredOrigins = appConfig?.corsOrigins ?? [];
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : fallbackOrigins;
  const allowAll = allowedOrigins.includes('*');

  const corsOptions: CorsOptions =
    allowAll || !allowedOrigins.length
      ? { origin: true, credentials: true }
      : {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
          },
          credentials: true,
        };

  app.enableCors(corsOptions);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const swaggerPath = appConfig?.swaggerPath ?? configService.get<string>('app.swaggerPath') ?? '/api';
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Freeler API')
    .setDescription('Documentacion de la API (Clean Architecture)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  return app;
}
