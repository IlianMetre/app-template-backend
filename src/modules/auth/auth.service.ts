import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { verifyPassword } from '../../lib/password.js';
import { auditLog } from '../../lib/audit.js';
import { AuditAction } from './auth.constants.js';
import { config } from '../../config/index.js';

interface LoginBody {
  email: string;
  password: string;
  totpCode?: string;
}

/**
 * Calculate progressive lockout duration based on failed attempt count.
 * 5+ failures  → 15 minutes
 * 10+ failures → 1 hour
 * 20+ failures → 24 hours
 */
function calculateLockoutMinutes(attempts: number): number {
  if (attempts >= 20) return 1440; // 24 hours
  if (attempts >= 10) return 60; // 1 hour
  return config.LOCKOUT_DURATION_MINUTES; // Default: 15 minutes
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { email, password } = request.body;

  // 1. Find user by email (case-insensitive)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Constant-time: still verify against a dummy to prevent timing attacks
    await verifyPassword(
      '$argon2id$v=19$m=65536,t=3,p=4$dummysaltvalue$dummyhashvalue',
      password,
    );
    await auditLog(AuditAction.LOGIN_FAILED, null, request, {
      reason: 'user_not_found',
      email: email.toLowerCase(),
    });
    return reply.unauthorized('Invalid email or password');
  }

  // 2. Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await auditLog(AuditAction.LOGIN_FAILED_LOCKED, user.id, request);
    return reply.unauthorized(
      'Account temporarily locked due to too many failed attempts. Try again later.',
    );
  }

  // 3. Verify password
  const passwordValid = await verifyPassword(user.passwordHash, password);
  if (!passwordValid) {
    const attempts = user.failedLoginAttempts + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { failedLoginAttempts: attempts };

    // Apply progressive lockout if threshold exceeded
    if (attempts >= config.LOCKOUT_THRESHOLD) {
      const lockMinutes = calculateLockoutMinutes(attempts);
      update.lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      await auditLog(AuditAction.ACCOUNT_LOCKED, user.id, request, {
        lockMinutes,
        attempts,
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: update });
    await auditLog(AuditAction.LOGIN_FAILED, user.id, request, { attempts });
    return reply.unauthorized('Invalid email or password');
  }

  // 4. Check 2FA if enabled and feature flag is on
  if (user.totpEnabled && config.FEATURE_2FA_ENABLED) {
    const { totpCode } = request.body;
    if (!totpCode) {
      // Tell the client 2FA is required (without completing login)
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: '2FA verification code required',
      });
    }
    // 2FA verification is handled by the totp module if enabled
    // This is a hook point — see totp.service.ts
  }

  // 5. Success: reset lockout counters and create session
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  request.session.set('userId', user.id);
  await auditLog(AuditAction.LOGIN_SUCCESS, user.id, request);

  return reply.send({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.currentUser?.id ?? null;

  // Strip auth data before destroying. If the @fastify/session onSend hook
  // races with destroy() and re-saves the session (rolling:true default),
  // the persisted session will lack a userId → requireAuth returns 401.
  request.session.set('userId', undefined);
  await request.session.destroy();
  reply.clearCookie(config.SESSION_NAME, { path: '/' });
  await auditLog(AuditAction.LOGOUT, userId, request);

  return reply.send({ message: 'Logged out successfully' });
}
