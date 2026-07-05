import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse allowed CORS origins from environment
  const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:4000';
  const origins = corsOriginEnv.split(',').map((o) => o.trim().replace(/\/$/, ''));

  // Serve uploaded files statically only in non-production environments.
  // In production, files are served from GCS or through the authenticated
  // GET /api/v1/upload/file/:filename endpoint.
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      '/uploads',
      (req: any, res: any, next: any) => {
        const origin = req.headers.origin;
        if (origin) {
          const normalizedOrigin = origin.replace(/\/$/, '');
          if (origins.includes(normalizedOrigin) || origins.includes('*')) {
            res.header('Access-Control-Allow-Origin', origin);
          }
        } else {
          res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET');
        next();
      },
      express.static(join(process.cwd(), 'uploads')),
    );
  }

  // Security headers (must be applied before routes)
  app.use(helmet());

  // Enable CORS with environment variable configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (origins.includes(normalizedOrigin) || origins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('PineZone Travel CRM API')
    .setDescription(
      'RESTful API for managing homestays, rooms, guests, and bookings. ' +
        'This API provides comprehensive endpoints for homestay property management, ' +
        'room inventory control, guest management, and booking operations.',
    )
    .setVersion('1.0')
    .addTag(
      'Homestay Management',
      'Endpoints for managing homestay properties and rooms',
    )
    .addTag('Guest Management', 'Endpoints for managing guest information')
    .addTag(
      'Lead Management',
      'Endpoints for tracking and managing leads with follow-ups',
    )
    .addTag(
      'Booking Management',
      'Endpoints for managing bookings and reservations',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:4001', 'Local Development Server')
    .addServer('https://api.pinezone.app', 'Production Server')
    .setContact(
      'PineZone Support',
      'https://pinezone.app',
      'support@pinezone.app',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI is only served in non-production environments.
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          theme: 'monokai',
        },
        tryItOutEnabled: true,
      },
      customSiteTitle: 'PineZone API Documentation',
      customfavIcon: 'https://pinezone.app/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { font-size: 2.5rem; }
      `,
    });
  }

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
