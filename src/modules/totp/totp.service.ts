import type { FastifyReply, FastifyRequest } from 'fastify';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { generateRecoveryCodes } from '../../lib/crypto.js';
import { auditLog } from '../../lib/audit.js';
import { AuditAction } from '../auth/auth.constants.js';

const ISSUER = 'AppTemplate';

/**
 * POST /auth/2fa/setup — Generate TOTP secret and return QR code.
 * Does NOT enable 2FA yet — user must verify with a code first.
 */
export async function setupTotpHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser!;

  if (user.totpEnabled) {
    return reply.badRequest('2FA is already enabled. Disable it first to re-setup.');
  }

  // Generate new TOTP secret
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const uri = totp.toString();
  const qrCode = await QRCode.toDataURL(uri);

  // Store secret temporarily (not yet enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret.base32 },
  });

  return reply.send({
    secret: secret.base32,
    uri,
    qrCode,
  });
}

/**
 * POST /auth/2fa/verify — Verify TOTP code and enable 2FA.
 * Returns recovery codes on success.
 */
export async function verifyTotpHandler(
  request: FastifyRequest<{ Body: { code: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser!;
  const { code } = request.body;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!dbUser?.totpSecret) {
    return reply.badRequest('No 2FA setup in progress. Call /auth/2fa/setup first.');
  }

  if (dbUser.totpEnabled) {
    return reply.badRequest('2FA is already enabled.');
  }

  // Verify the code
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(dbUser.totpSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return reply.unauthorized('Invalid 2FA code. Please try again.');
  }

  // Generate and hash recovery codes
  const plainCodes = generateRecoveryCodes(10);
  const hashedCodes = await Promise.all(
    plainCodes.map(async (c) => ({
      codeHash: await hashPassword(c.replace('-', '')), // Hash without dash
      userId: user.id,
    })),
  );

  // Enable 2FA and store recovery codes in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    }),
    // Remove old recovery codes
    prisma.recoveryCode.deleteMany({ where: { userId: user.id } }),
    // Store new ones
    prisma.recoveryCode.createMany({ data: hashedCodes }),
  ]);

  await auditLog(AuditAction.TOTP_ENABLED, user.id, request);

  return reply.send({
    message: '2FA enabled successfully. Save your recovery codes securely.',
    recoveryCodes: plainCodes,
  });
}

/**
 * POST /auth/2fa/disable — Disable 2FA (requires password confirmation).
 */
export async function disableTotpHandler(
  request: FastifyRequest<{ Body: { password: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const user = request.currentUser!;
  const { password } = request.body;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, totpEnabled: true },
  });

  if (!dbUser?.totpEnabled) {
    return reply.badRequest('2FA is not currently enabled.');
  }

  // Verify password before disabling 2FA
  const valid = await verifyPassword(dbUser.passwordHash, password);
  if (!valid) {
    return reply.unauthorized('Invalid password.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
      },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId: user.id } }),
  ]);

  await auditLog(AuditAction.TOTP_DISABLED, user.id, request);

  return reply.send({ message: '2FA has been disabled.' });
}
