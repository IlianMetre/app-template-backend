import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../config/index.js';

export default fp(
  async (fastify) => {
    await fastify.register(cors, {
      origin: config.CORS_ORIGIN,
      credentials: true, // Required for cookie-based auth
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      maxAge: 86400, // Preflight cache: 24 hours
    });
  },
  { name: 'cors-plugin' },
);
