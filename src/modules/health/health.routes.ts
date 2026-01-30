import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { healthResponseSchema } from './health.schemas.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get('/health', {
    schema: {
      response: { 200: healthResponseSchema },
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns the health status of the API',
    },
    config: {
      // Exempt health checks from rate limiting
      rateLimit: false,
    },
    handler: async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    },
  });
}
