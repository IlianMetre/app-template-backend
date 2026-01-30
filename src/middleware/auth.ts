import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';

/**
 * PreHandler hook that requires an authenticated session.
 * Attaches the current user to `request.currentUser`.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.session.get('userId');

  if (!userId) {
    return reply.unauthorized('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      totpEnabled: true,
    },
  });

  if (!user) {
    // User was deleted while session was still active
    await request.session.destroy();
    return reply.unauthorized('User not found');
  }

  request.currentUser = user;
}
