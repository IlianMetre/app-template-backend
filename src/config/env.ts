import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_MAX_AGE: z.coerce.number().default(86400000), // 24 hours
  SESSION_NAME: z.string().default('sid'),

  CSRF_HMAC_KEY: z.string().min(32, 'CSRF_HMAC_KEY must be at least 32 characters'),

  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),

  LOCKOUT_THRESHOLD: z.coerce.number().default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().default(15),

  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),

  FEATURE_2FA_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(
      JSON.stringify(result.error.flatten().fieldErrors, null, 2),
    );
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
