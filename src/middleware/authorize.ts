import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';

/**
 * Factory that creates a preHandler hook requiring one of the specified roles.
 * Must be used after `requireAuth` (which sets `request.currentUser`).
 *
 * Usage:
 *   preHandler: [requireAuth, requireRole('ADMIN')]
 */
export function requireRole(...roles: Role[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.currentUser) {
      return reply.unauthorized('Authentication required');
    }

    if (!roles.includes(request.currentUser.role)) {
      return reply.forbidden('Insufficient permissions');
    }
  };
}
