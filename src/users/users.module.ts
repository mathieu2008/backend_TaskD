import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { Env } from '../config/env';
import { InMemoryUsersRepository } from './in-memory-users.repository';
import { PgUsersRepository } from './pg-users.repository';
import { USERS_REPOSITORY } from './users.repository';

/**
 * Picks the storage from the environment:
 * DATABASE_URL present -> PostgreSQL, absent -> in memory.
 * Switching to the shared database later changes one variable, not one line of business code.
 */
@Module({
  providers: [
    {
      provide: USERS_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const logger = new Logger('UsersModule');
        const databaseUrl = config.get('DATABASE_URL');

        if (!databaseUrl) {
          logger.warn('DATABASE_URL is not set: using the in-memory repository (data lost on restart).');
          return new InMemoryUsersRepository();
        }
        const pool = new Pool({ connectionString: databaseUrl });
        pool.on('error', (error) => logger.error(`PostgreSQL pool error: ${error.message}`));
        return new PgUsersRepository(pool);
      },
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}