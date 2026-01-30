import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '../../middleware/auth.js';
import {
  errorResponseSchema,
  totpDisableBodySchema,
  totpDisableResponseSchema,
  totpSetupResponseSchema,
  totpVerifyBodySchema,
  totpVerifyResponseSchema,
} from './totp.schemas.js';
import {
  disableTotpHandler,
  setupTotpHandler,
  verifyTotpHandler,
} from './totp.service.js';

export async function totpRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /auth/2fa/setup — generate TOTP secret + QR code
  typedApp.post('/auth/2fa/setup', {
    schema: {
      response: {
        200: totpSetupResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
      tags: ['2FA'],
      summary: 'Setup 2FA',
      description: 'Generates a TOTP secret and QR code for 2FA setup.',
    },
    onRequest: [requireAuth],
    handler: setupTotpHandler,
  });

  // POST /auth/2fa/verify — verify code and enable 2FA
  typedApp.post('/auth/2fa/verify', {
    schema: {
      body: totpVerifyBodySchema,
      response: {
        200: totpVerifyResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
      tags: ['2FA'],
      summary: 'Verify and enable 2FA',
      description:
        'Verifies a TOTP code and enables 2FA. Returns one-time recovery codes.',
    },
    onRequest: [requireAuth],
    handler: verifyTotpHandler,
  });

  // POST /auth/2fa/disable — disable 2FA (requires password)
  typedApp.post('/auth/2fa/disable', {
    schema: {
      body: totpDisableBodySchema,
      response: {
        200: totpDisableResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
      tags: ['2FA'],
      summary: 'Disable 2FA',
      description: 'Disables 2FA. Requires password confirmation.',
    },
    onRequest: [requireAuth],
    handler: disableTotpHandler,
  });
}
