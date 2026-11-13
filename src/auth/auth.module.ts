import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Clock, SystemClock } from '../common/clock';
import type { Env } from '../config/env';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConsoleMailer, Mailer } from './mailer';
import { BcryptPasswordHasher, PasswordHasher } from './password-hasher';
import { SessionCookie } from './session-cookie';
import { SessionTokens } from './session-tokens';
import { SessionsController } from './sessions.controller';
import { UsersController } from './users.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: config.get('SESSION_TTL_DAYS') * 24 * 60 * 60 },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [UsersController, SessionsController],
  providers: [
    AuthService,
    SessionTokens,
    SessionCookie,
    JwtAuthGuard,
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: Mailer, useClass: ConsoleMailer },
    { provide: Clock, useClass: SystemClock },
  ],
})
export class AuthModule {}