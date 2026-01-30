import { buildApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

async function main() {
  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.PORT}`);
    app.log.info(`API docs available at http://localhost:${config.PORT}/docs`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
