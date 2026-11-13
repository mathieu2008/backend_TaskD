import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SESSION_COOKIE } from './auth/session-cookie';
import { configureApp } from './common/configure-app';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Swagger is never exposed in production (security rule).
  if (config.get('NODE_ENV') !== 'production') {
    const document = new DocumentBuilder()
      .setTitle('identity-service')
      .setVersion('1.0')
      .addCookieAuth(SESSION_COOKIE)
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, document));
  }

  await app.listen(config.get('PORT'));
}

void bootstrap();