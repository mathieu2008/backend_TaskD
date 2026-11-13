import { randomUUID } from 'node:crypto';
import { EmailAlreadyUsedError } from '../auth/auth.errors';
import type { AccountStatus, LoginThrottleState, NewUser, User } from './user.types';
import type { UsersRepository } from './users.repository';

/** Development and tests only: data is lost when the process stops. */
export class InMemoryUsersRepository implements UsersRepository {
  private readonly users = new Map<string, User>();

  async create(input: NewUser): Promise<User> {
    const emailTaken = [...this.users.values()].some((u) => u.email === input.email);
    if (emailTaken) throw new EmailAlreadyUsedError();

    const now = new Date();
    const user: User = {
      ...input,
      id: randomUUID(),
      status: 'active',
      failedLoginCount: 0,
      lastFailedLoginAt: null,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = [...this.users.values()].find((u) => u.email === email);
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async saveLoginThrottle(userId: string, state: LoginThrottleState): Promise<void> {
    const user = this.users.get(userId);
    if (user) this.users.set(userId, { ...user, ...state, updatedAt: new Date() });
  }

  /** Test helper: an administrator will do this through the back-office (US-50). */
  setStatusForTests(userId: string, status: AccountStatus): void {
    const user = this.users.get(userId);
    if (user) this.users.set(userId, { ...user, status });
  }
}