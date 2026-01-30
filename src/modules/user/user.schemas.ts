import { z } from 'zod';

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  totpEnabled: z.boolean(),
  createdAt: z.string(),
});

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional(),
  })
  .refine((data) => data.displayName !== undefined || data.email !== undefined, {
    message: 'At least one field must be provided',
  });

export const updateProfileResponseSchema = z.object({
  message: z.string(),
  user: userProfileSchema,
});

export const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
