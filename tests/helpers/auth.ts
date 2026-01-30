import type { FastifyInstance } from 'fastify';

export async function createTestUser(
  overrides: Record<string, unknown> = {},
) {
  const { prisma } = await import('../../src/lib/prisma.js');
  const { hashPassword } = await import('../../src/lib/password.js');

  const passwordHash = await hashPassword('TestPassword123!');
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
      displayName: 'Test User',
      role: 'USER',
      ...overrides,
    },
  });
}

export async function loginAs(
  app: FastifyInstance,
  email: string = 'test@example.com',
  password: string = 'TestPassword123!',
) {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });

  // Extract cookies from response
  const setCookieHeaders = response.headers['set-cookie'];
  const cookies = Array.isArray(setCookieHeaders)
    ? setCookieHeaders.map((c) => c.split(';')[0]).join('; ')
    : setCookieHeaders
      ? setCookieHeaders.split(';')[0]
      : '';

  return { response, cookies };
}
