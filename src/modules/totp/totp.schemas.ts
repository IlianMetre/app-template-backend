import { z } from 'zod';

export const totpSetupResponseSchema = z.object({
  secret: z.string(),
  uri: z.string(),
  qrCode: z.string(), // Data URI for QR code image
});

export const totpVerifyBodySchema = z.object({
  code: z.string().length(6),
});

export const totpVerifyResponseSchema = z.object({
  message: z.string(),
  recoveryCodes: z.array(z.string()),
});

export const totpDisableBodySchema = z.object({
  password: z.string().min(1),
});

export const totpDisableResponseSchema = z.object({
  message: z.string(),
});

export const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
