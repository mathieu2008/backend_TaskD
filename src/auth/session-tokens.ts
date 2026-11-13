import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role, User } from '../users/user.types';

export interface SessionPayload {
  sub: string;
  roles: Role[];
}

@Injectable()
export class SessionTokens {
  constructor(private readonly jwt: JwtService) {}

  sign(user: User): Promise<string> {
    return this.jwt.signAsync({ sub: user.id, roles: user.roles });
  }

  /** Returns null for an expired, forged or malformed token. */
  async verify(token: string): Promise<SessionPayload | null> {
    try {
      return await this.jwt.verifyAsync<SessionPayload>(token);
    } catch {
      return null;
    }
  }
}