import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config/index.js';

export default fp(
  async (fastify) => {
    await fastify.register(rateLimit, {
      max: config.RATE_LIMIT_GLOBAL_MAX,
      timeWindow: '1 minute',
      errorResponseBuilder: (_request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((context.ttl ?? 60000) / 1000)} seconds.`,
      }),
    });
  },
  { name: 'rate-limit-plugin' },
);
