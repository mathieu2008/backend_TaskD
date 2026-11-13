import type { LoginThrottleState, NewUser, User } from './user.types';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

/**
 * The contract between the business code and the storage.
 * Two implementations exist: in memory (no database needed) and PostgreSQL.
 */
export interface UsersRepository {
  /** Throws EmailAlreadyUsedError if the email already exists. */
  create(input: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  saveLoginThrottle(userId: string, state: LoginThrottleState): Promise<void>;
}