import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

export default fp(
  async (fastify) => {
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger UI requires inline scripts
          styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI requires inline styles
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger UI to load external resources
    });
  },
  { name: 'helmet-plugin' },
);
