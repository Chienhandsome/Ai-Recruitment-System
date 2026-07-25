"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    logger.log('Starting AI Recruitment System Backend...');
    logger.log(`Environment: ${process.env.NODE_ENV ?? 'not set'}`);
    logger.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ?? 'NOT SET'}`);
    logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '***configured***' : 'NOT SET'}`);
    logger.log(`RABBITMQ_URL: ${process.env.RABBITMQ_URL ? '***configured***' : 'NOT SET'}`);
    logger.log(`AI_SERVICE_URL: ${process.env.AI_SERVICE_URL ?? 'NOT SET'}`);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['log', 'warn', 'error']
            : ['log', 'warn', 'error', 'debug', 'verbose'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
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
    const vercelPreviewOriginPattern = /^https:\/\/ai-recruitment-system-test-deploy-[a-z0-9-]+\.vercel\.app$/;
    logger.log(`CORS allowed origins: ${corsOrigins.join(', ')}`);
    const corsOptions = {
        origin: (origin, callback) => {
            const isAllowed = !origin ||
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
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AI Recruitment API')
        .setDescription('API documentation for the AI Recruitment System')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? process.env.BACKEND_PORT ?? 3001;
    await app.listen(port);
    logger.log(`Backend is running on: http://localhost:${port}/api`);
    logger.log(`API documentation available at: http://localhost:${port}/api/docs`);
    logger.log(`Startup complete.`);
}
void bootstrap();
//# sourceMappingURL=main.js.map