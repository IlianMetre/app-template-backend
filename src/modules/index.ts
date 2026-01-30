import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health/index.js';
import { authRoutes } from './auth/index.js';
import { userRoutes } from './user/index.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);

  // 2FA routes are registered conditionally — see totp module
  if (process.env.FEATURE_2FA_ENABLED === 'true') {
    const { totpRoutes } = await import('./totp/index.js');
    await app.register(totpRoutes);
  }
}
