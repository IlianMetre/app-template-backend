import type { FastifyRequest } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

/** Keys that must never appear in audit log metadata */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'hash',
  'passwordhash',
  'totpsecret',
  'authorization',
  'cookie',
]);

function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !SENSITIVE_KEYS.has(key.toLowerCase()),
    ),
  );
}

export async function auditLog(
  action: string,
  userId: string | null,
  request: FastifyRequest,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const sanitized = sanitizeMetadata(metadata);

  // Structured log via pino
  request.log.info(
    { audit: true, action, userId, metadata: sanitized },
    `Audit: ${action}`,
  );

  // Persist to database (failure must not break the request)
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
        metadata: (sanitized as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    request.log.error(err, 'Failed to persist audit log');
  }
}
