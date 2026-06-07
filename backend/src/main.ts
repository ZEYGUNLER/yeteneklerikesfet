import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

// Process-level crash guards — prevent silent death from unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', String(reason));
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins for local development
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  logger.log(`Backend running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();

