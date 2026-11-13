import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Env } from '../config/env';
import { ValidationFailedError } from './domain-error';
import { DomainErrorFilter } from './domain-error.filter';

/** Shared by main.ts and the tests, so both run the exact same setup. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.get('CORS_ORIGIN'), credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // a client cannot slip in "role": "admin" or any unknown field
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationFailedError(
          errors.map((e) => ({ field: e.property, messages: Object.values(e.constraints ?? {}) })),
        ),
    }),
  );
  app.useGlobalFilters(new DomainErrorFilter());
}