import type { FastifyInstance } from 'fastify';
import sensiblePlugin from './sensible.js';
import helmetPlugin from './helmet.js';
import corsPlugin from './cors.js';
import rateLimitPlugin from './rate-limit.js';
import sessionPlugin from './session.js';
import csrfPlugin from './csrf.js';
import swaggerPlugin from './swagger.js';

/**
 * Register all plugins in the correct order.
 * Order matters: each plugin may depend on the previous ones.
 */
export async function registerPlugins(app: FastifyInstance): Promise<void> {
  // 1. HTTP error helpers
  await app.register(sensiblePlugin);

  // 2. Secure response headers
  await app.register(helmetPlugin);

  // 3. CORS (before route processing)
  await app.register(corsPlugin);

  // 4. Global rate limiting
  await app.register(rateLimitPlugin);

  // 5. Cookie + Session (session depends on cookie)
  await app.register(sessionPlugin);

  // 6. CSRF protection (depends on cookie + session)
  await app.register(csrfPlugin);

  // 7. OpenAPI documentation (registers validation compilers)
  await app.register(swaggerPlugin);
}
