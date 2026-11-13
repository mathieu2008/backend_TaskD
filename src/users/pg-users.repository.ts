import type { Pool } from 'pg';
import { EmailAlreadyUsedError } from '../auth/auth.errors';
import type { AccountStatus, LoginThrottleState, NewUser, Role, User } from './user.types';
import type { UsersRepository } from './users.repository';

type UserRow = {
  id: string;
  last_name: string;
  first_names: string;
  phone: string;
  email: string;
  profession: string;
  password_hash: string;
  roles: string[];
  status: string;
  failed_login_count: number;
  last_failed_login_at: Date | null;
  locked_until: Date | null;
  terms_accepted_at: Date;
  created_at: Date;
  updated_at: Date;
};

// A constant, never built from user input: safe to interpolate.
const COLUMNS = `id, last_name, first_names, phone, email, profession, password_hash, roles, status,
  failed_login_count, last_failed_login_at, locked_until, terms_accepted_at, created_at, updated_at`;

const UNIQUE_VIOLATION = '23505';

export class PgUsersRepository implements UsersRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: NewUser): Promise<User> {
    try {
      const { rows } = await this.pool.query<UserRow>(
        `INSERT INTO identity.users
           (last_name, first_names, phone, email, profession, password_hash, roles, terms_accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8)
         RETURNING ${COLUMNS}`,
        [
          input.lastName,
          input.firstNames,
          input.phone,
          input.email,
          input.profession,
          input.passwordHash,
          input.roles,
          input.termsAcceptedAt,
        ],
      );
      return toUser(rows[0]!);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) throw new EmailAlreadyUsedError();
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT ${COLUMNS} FROM identity.users WHERE email = $1`,
      [email],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT ${COLUMNS} FROM identity.users WHERE id = $1`,
      [id],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async saveLoginThrottle(userId: string, state: LoginThrottleState): Promise<void> {
    await this.pool.query(
      `UPDATE identity.users
          SET failed_login_count = $2, last_failed_login_at = $3, locked_until = $4, updated_at = now()
        WHERE id = $1`,
      [userId, state.failedLoginCount, state.lastFailedLoginAt, state.lockedUntil],
    );
  }
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    lastName: row.last_name,
    firstNames: row.first_names,
    phone: row.phone,
    email: row.email,
    profession: row.profession,
    passwordHash: row.password_hash,
    roles: row.roles as Role[],
    status: row.status as AccountStatus,
    failedLoginCount: row.failed_login_count,
    lastFailedLoginAt: row.last_failed_login_at,
    lockedUntil: row.locked_until,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}