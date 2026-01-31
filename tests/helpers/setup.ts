import type { FastifyInstance } from 'fastify';

// Set test environment variables before any imports that read config
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://appuser:apppassword@localhost:5432/appdb?schema=public';
process.env.SESSION_SECRET =
  'test-session-secret-that-is-at-least-32-characters-long-for-testing';
process.env.CSRF_HMAC_KEY =
  'test-csrf-hmac-key-that-is-at-least-32-chars-long';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_GLOBAL_MAX = '1000'; // High limit for tests
process.env.RATE_LIMIT_AUTH_MAX = '100'; // High limit for tests
process.env.FEATURE_2FA_ENABLED = 'false';

let _app: FastifyInstance | null = null;

export async function createTestApp(): Promise<FastifyInstance> {
  // Dynamic import to ensure env is set first
  const { buildApp } = await import('../../src/app.js');
  _app = await buildApp();
  await _app.ready();
  return _app;
}

export async function closeTestApp(): Promise<void> {
  if (_app) {
    await _app.close();
    _app = null;
  }
}

export async function cleanDatabase(): Promise<void> {
  const { prisma } = await import('../../src/lib/prisma.js');
  // Delete in order respecting foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.recoveryCode.deleteMany();
  await prisma.user.deleteMany();
}
