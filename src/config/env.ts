import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || Boolean(env.DATABASE_URL), {
    message: 'DATABASE_URL is required in production',
    path: ['DATABASE_URL'],
  });

export type Env = z.infer<typeof envSchema>;