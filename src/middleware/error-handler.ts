import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Zod validation errors (from fastify-type-provider-zod)
  if (hasZodFastifySchemaValidationErrors(error)) {
    reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.validation,
    });
    return;
  }

  // Known HTTP errors (from @fastify/sensible or manual throws)
  if (error.statusCode && error.statusCode < 500) {
    reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name || 'Error',
      message: error.message,
    });
    return;
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message || 'Rate limit exceeded',
    });
    return;
  }

  // Unexpected errors: log full details, return generic message
  request.log.error(error, 'Unhandled error');
  reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    // SECURITY: never expose error.message or stack in production
  });
}
