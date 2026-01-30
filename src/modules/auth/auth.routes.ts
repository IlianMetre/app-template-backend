import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from '../../config/index.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  csrfTokenResponseSchema,
  errorResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  logoutResponseSchema,
} from './auth.schemas.js';
import { loginHandler, logoutHandler } from './auth.service.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /auth/login — stricter rate limit for brute-force protection
  typedApp.post('/auth/login', {
    schema: {
      body: loginBodySchema,
      response: {
        200: loginResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        429: errorResponseSchema,
      },
      tags: ['Auth'],
      summary: 'Login with email and password',
      description:
        'Authenticates a user and creates a session. Rate limited to prevent brute-force attacks.',
    },
    config: {
      rateLimit: {
        max: config.RATE_LIMIT_AUTH_MAX,
        timeWindow: '15 minutes',
      },
    },
    handler: loginHandler,
  });

  // POST /auth/logout — requires active session
  typedApp.post('/auth/logout', {
    schema: {
      response: {
        200: logoutResponseSchema,
        401: errorResponseSchema,
      },
      tags: ['Auth'],
      summary: 'Logout and destroy session',
    },
    onRequest: [requireAuth],
    handler: logoutHandler,
  });

  // GET /auth/csrf-token — get a CSRF token for state-changing requests
  typedApp.get('/auth/csrf-token', {
    schema: {
      response: {
        200: csrfTokenResponseSchema,
      },
      tags: ['CSRF'],
      summary: 'Get CSRF token',
      description:
        'Returns a CSRF token to be sent as X-CSRF-Token header on state-changing requests.',
    },
    handler: async (_request, reply) => {
      const token = reply.generateCsrf();
      return { token };
    },
  });
}
