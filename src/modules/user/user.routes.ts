import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '../../middleware/auth.js';
import {
  errorResponseSchema,
  updateProfileBodySchema,
  updateProfileResponseSchema,
  userProfileSchema,
} from './user.schemas.js';
import { getMeHandler, updateMeHandler } from './user.service.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /me — return current user profile
  typedApp.get('/me', {
    schema: {
      response: {
        200: userProfileSchema,
        401: errorResponseSchema,
      },
      tags: ['User'],
      summary: 'Get current user profile',
      description: 'Returns the profile of the currently authenticated user.',
    },
    onRequest: [requireAuth],
    handler: getMeHandler,
  });

  // PATCH /me — update current user profile
  typedApp.patch('/me', {
    schema: {
      body: updateProfileBodySchema,
      response: {
        200: updateProfileResponseSchema,
        401: errorResponseSchema,
        409: errorResponseSchema,
      },
      tags: ['User'],
      summary: 'Update current user profile',
      description: 'Updates the display name and/or email of the current user.',
    },
    onRequest: [requireAuth],
    preHandler: [
      // Verify CSRF token for state-changing request.
      // csrfProtection is decorated on the FastifyInstance by @fastify/csrf-protection.
      (request, reply, done) => {
        app.csrfProtection(request, reply, done);
      },
    ],
    handler: updateMeHandler,
  });
}
