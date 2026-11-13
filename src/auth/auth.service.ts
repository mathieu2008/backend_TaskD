import { Inject, Injectable, Logger } from '@nestjs/common';
import { Clock } from '../common/clock';
import type { LoginThrottleState, RegistrableRole, User } from '../users/user.types';
import { USERS_REPOSITORY, type UsersRepository } from '../users/users.repository';
import {
  AccountLockedError,
  AccountSuspendedError,
  EmailAlreadyUsedError,
  InvalidCredentialsError,
  NotAuthenticatedError,
} from './auth.errors';
import { Mailer } from './mailer';
import { PasswordHasher } from './password-hasher';

export interface RegisterInput {
  lastName: string;
  firstNames: string;
  phone: string;
  email: string;
  profession: string;
  password: string;
  role: RegistrableRole;
}

const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60_000;
const LOCK_DURATION_MS = 15 * 60_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
  ) {}

  /** US-03 / US-04 */
  async register(input: RegisterInput): Promise<User> {
    if (await this.users.findByEmail(input.email)) throw new EmailAlreadyUsedError();

    const passwordHash = await this.hasher.hash(input.password);
    // The UNIQUE index in the database still protects us if two requests arrive together.
    const user = await this.users.create({
      lastName: input.lastName,
      firstNames: input.firstNames,
      phone: input.phone,
      email: input.email,
      profession: input.profession,
      passwordHash,
      roles: [input.role],
      termsAcceptedAt: this.clock.now(),
    });

    await this.sendWelcomeEmail(user);
    return user;
  }

  /** US-05 */
  async login(identifier: string, password: string): Promise<User> {
    const now = this.clock.now();
    const user = await this.users.findByEmail(identifier);

    if (!user) {
      await this.hasher.burn(password);
      throw new InvalidCredentialsError();
    }
    if (user.lockedUntil && user.lockedUntil > now) throw new AccountLockedError(user.lockedUntil);

    if (!(await this.hasher.verify(password, user.passwordHash))) {
      const throttle = nextThrottleState(user, now);
      await this.users.saveLoginThrottle(user.id, throttle);
      if (throttle.lockedUntil) throw new AccountLockedError(throttle.lockedUntil);
      throw new InvalidCredentialsError();
    }

    // Suspension is only revealed to someone who knows the password.
    if (user.status === 'suspended') throw new AccountSuspendedError();

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.users.saveLoginThrottle(user.id, { failedLoginCount: 0, lastFailedLoginAt: null, lockedUntil: null });
    }
    return user;
  }

  /** Used by GET /users/me: a suspended or deleted account loses access immediately. */
  async getActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user || user.status !== 'active') throw new NotAuthenticatedError();
    return user;
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailer.sendWelcome(user);
    } catch {
      // The account exists: a mail failure must not cancel the sign-up.
      this.logger.error(`Confirmation email failed for user ${user.id}`);
    }
  }
}

function nextThrottleState(user: User, now: Date): LoginThrottleState {
  const withinWindow =
    user.lastFailedLoginAt !== null && now.getTime() - user.lastFailedLoginAt.getTime() < FAILURE_WINDOW_MS;
  const failedLoginCount = withinWindow ? user.failedLoginCount + 1 : 1;

  return {
    failedLoginCount,
    lastFailedLoginAt: now,
    lockedUntil: failedLoginCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MS) : null,
  };
}