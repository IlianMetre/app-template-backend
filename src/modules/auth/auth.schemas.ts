import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).optional(),
});

export const loginResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string().nullable(),
    role: z.enum(['USER', 'ADMIN']),
  }),
});

export const logoutResponseSchema = z.object({
  message: z.string(),
});

export const csrfTokenResponseSchema = z.object({
  token: z.string(),
});

export const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
