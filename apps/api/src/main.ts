import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  if (
    process.env['NODE_ENV'] === 'production' &&
    process.env['DEV_AUTH_BYPASS'] === '1'
  ) {
    throw new Error('DEV_AUTH_BYPASS must not be enabled in production.');
  }

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      process.env['WEB_ORIGIN'] ?? 'http://localhost:4200',
      process.env['STUDIO_ORIGIN'] ?? 'http://localhost:4201',
    ],
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = Number(process.env['API_PORT'] ?? process.env['PORT'] ?? 3001);
  await app.listen(port);
  Logger.log(`API running at http://localhost:${port}/api`);
}

bootstrap();
