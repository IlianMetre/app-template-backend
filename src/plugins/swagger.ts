import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

export default fp(
  async (fastify) => {
    // Set Zod type provider compilers
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);

    await fastify.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'App Template Backend API',
          description: 'Secure backend API template with Fastify, Prisma, and PostgreSQL',
          version: '1.0.0',
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Auth', description: 'Authentication endpoints' },
          { name: 'User', description: 'User profile endpoints' },
          { name: 'CSRF', description: 'CSRF token endpoint' },
          { name: '2FA', description: 'Two-factor authentication (optional)' },
        ],
      },
      transform: jsonSchemaTransform,
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  },
  { name: 'swagger-plugin' },
);
