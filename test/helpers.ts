import { AuthService, type RegisterInput } from '../src/auth/auth.service';
import { Mailer } from '../src/auth/mailer';
import { PasswordHasher } from '../src/auth/password-hasher';
import { Clock } from '../src/common/clock';
import { InMemoryUsersRepository } from '../src/users/in-memory-users.repository';
import type { User } from '../src/users/user.types';

export class FakePasswordHasher extends PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }
  verify(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
  burn(): Promise<void> {
    return Promise.resolve();
  }
}

export class FakeClock extends Clock {
  constructor(private current: Date) {
    super();
  }
  now(): Date {
    return this.current;
  }
  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class RecordingMailer extends Mailer {
  readonly welcomedUserIds: string[] = [];
  sendWelcome(user: User): Promise<void> {
    this.welcomedUserIds.push(user.id);
    return Promise.resolve();
  }
}

export function buildRegisterInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    lastName: 'Doe',
    firstNames: 'Jane',
    phone: '+22901020304',
    email: 'jane@example.com',
    profession: 'Web designer',
    password: 'Secret123',
    role: 'delegator',
    ...overrides,
  };
}

export function buildAuthService() {
  const users = new InMemoryUsersRepository();
  const clock = new FakeClock(new Date('2026-11-12T10:00:00Z'));
  const mailer = new RecordingMailer();
  const service = new AuthService(users, new FakePasswordHasher(), mailer, clock);
  return { service, users, clock, mailer };
}

export async function failLogin(service: AuthService, email: string, times: number): Promise<void> {
  for (let attempt = 0; attempt < times; attempt++) {
    await service.login(email, 'Wrong1234').catch(() => undefined);
  }
}