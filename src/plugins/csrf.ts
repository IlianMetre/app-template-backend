import fp from 'fastify-plugin';
import csrf from '@fastify/csrf-protection';
import { config } from '../config/index.js';

export default fp(
  async (fastify) => {
    await fastify.register(csrf, {
      sessionPlugin: '@fastify/session',
      csrfOpts: {
        hmacKey: config.CSRF_HMAC_KEY,
      },
      getToken: (request) => {
        // Accept CSRF token from X-CSRF-Token header (used by SPA frontends)
        return request.headers['x-csrf-token'] as string;
      },
    });
  },
  { name: 'csrf-plugin' },
);
