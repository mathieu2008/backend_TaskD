import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { NotAuthenticatedError } from './auth.errors';
import { SESSION_COOKIE } from './session-cookie';
import { SessionTokens, type SessionPayload } from './session-tokens';

export type AuthenticatedRequest = Request & { user?: SessionPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: SessionTokens) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string') throw new NotAuthenticatedError();

    const payload = await this.tokens.verify(token);
    if (!payload) throw new NotAuthenticatedError();

    request.user = payload;
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): SessionPayload => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user as SessionPayload;
});