import type { Role } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      email: string;
      displayName: string | null;
      role: Role;
      totpEnabled: boolean;
    };
  }

  // Augment the Session interface used by @fastify/session.
  // The session's get/set methods use keys of Fastify.Session.
  // Optional because a fresh session may not have userId yet.
  interface Session {
    userId?: string;
  }
}
