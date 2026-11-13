import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';

export const SESSION_COOKIE = 'taskd_session';

/** The token lives in an HttpOnly cookie: JavaScript in the page can never read it. */
@Injectable()
export class SessionCookie {
  constructor(private readonly config: ConfigService<Env, true>) {}

  set(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: this.config.get('SESSION_TTL_DAYS') * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}