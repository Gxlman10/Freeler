import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  const swaggerPath = configService.get<string>('app.swaggerPath') ?? '/api';

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Freeler API')
    .setDescription('Documentación de la API (Clean Architecture)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  await app.listen(port);
  console.log(`🚀 API http://localhost:${port}${swaggerPath}`);
}
void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('Error starting application', error);
    process.exit(1);
  }
})();
