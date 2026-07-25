import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Starting AI Recruitment System Backend...');
  logger.log(`Environment: ${process.env.NODE_ENV ?? 'not set'}`);
  logger.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ?? 'NOT SET'}`);
  logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '***configured***' : 'NOT SET'}`);
  logger.log(`RABBITMQ_URL: ${process.env.RABBITMQ_URL ? '***configured***' : 'NOT SET'}`);
  logger.log(`AI_SERVICE_URL: ${process.env.AI_SERVICE_URL ?? 'NOT SET'}`);

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  // 1. Configure Global Prefix
  app.setGlobalPrefix('api');

  // 2. Configure ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. Enable CORS for the configured frontend origins
  const defaultCorsOrigins = [
    'https://ai-recruitment-system-test-deploy.vercel.app',
    'https://ai-recruitment-system-test-deploy-1.vercel.app',
    'http://localhost:3000',
  ];
  const configuredCorsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOrigins = [
    ...new Set([...defaultCorsOrigins, ...configuredCorsOrigins]),
  ];
  const vercelPreviewOriginPattern =
    /^https:\/\/ai-recruitment-system-test-deploy-[a-z0-9-]+\.vercel\.app$/;

  logger.log(`CORS allowed origins: ${corsOrigins.join(', ')}`);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      const isAllowed =
        !origin ||
        corsOrigins.includes(origin) ||
        vercelPreviewOriginPattern.test(origin);

      if (!isAllowed && origin) {
        logger.warn(`CORS blocked request from origin: ${origin}`);
      }

      callback(null, isAllowed);
    },
    credentials: true,
  };

  app.enableCors(corsOptions);

  // 4. Setup Swagger at /api/docs
  const config = new DocumentBuilder()
    .setTitle('AI Recruitment API')
    .setDescription('API documentation for the AI Recruitment System')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? process.env.BACKEND_PORT ?? 3001;
  await app.listen(port);
  logger.log(`Backend is running on: http://localhost:${port}/api`);
  logger.log(`API documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`Startup complete.`);
}
void bootstrap();
